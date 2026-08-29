import { API_BASE } from './env';
import {
  addPending,
  canRetryNow,
  flushPendingToQueue,
  loadQueueState,
  recordSyncFailure,
  recordSyncSuccess,
  removeFromQueue,
  saveQueueState,
  totalPending,
  type QueueState,
} from './globalTotalsQueue';
import { getCachedSyncConfig, getSyncConfig } from './syncConfigClient';
import type { GlobalTotals, PracticeCategory } from './types';

/** How often the client checks whether anything queued is worth (re)sending. Not itself a guaranteed request — gated by queue contents + backoff. */
const SYNC_CHECK_INTERVAL_MS = 30_000;

type Listener = (state: QueueState) => void;

/**
 * Owns the anonymous-contribution queue: batches repetitions locally
 * (server-configured threshold — see syncConfigClient.ts — defaulting to
 * one batch per 100 repetitions), persists them in IndexedDB, and syncs to
 * the Worker API with idempotency keys and controlled exponential backoff.
 * Never transmits anything beyond a category and a positive integer
 * amount, and never blocks or loses personal counting, which lives
 * entirely outside this module.
 */
class GlobalTotalsClient {
  private state: QueueState = {
    pending: { chant: 0, affirmation: 0 },
    queue: [],
    consecutiveFailures: 0,
    nextRetryAt: 0,
  };
  private ready: Promise<void>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private syncing = false;

  constructor() {
    this.ready = typeof window === 'undefined' ? Promise.resolve() : this.hydrate();
  }

  private async hydrate() {
    this.state = await loadQueueState();
    this.listeners.forEach((l) => l(this.state));
  }

  private setState(next: QueueState) {
    this.state = next;
    void saveQueueState(next); // best-effort, never blocks the caller
    this.listeners.forEach((l) => l(next));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): QueueState {
    return this.state;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => void this.sync(), SYNC_CHECK_INTERVAL_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
    }
    void getSyncConfig(); // warm the config cache early, off the hot tap path
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
    }
  }

  private handleOnline = () => {
    void this.sync();
  };

  /**
   * Records one repetition locally. Only crosses into a queued, syncable
   * batch once the server-configured threshold is reached — never on
   * every repetition, and not on a fixed timer either (see spec: "Never
   * call the server after every repetition").
   */
  record(category: PracticeCategory, contributionEnabled: boolean) {
    if (!contributionEnabled) return;
    let next = addPending(this.state, category, 1);
    const threshold = getCachedSyncConfig().batchThreshold;
    if (totalPending(next) >= threshold) {
      next = flushPendingToQueue(next);
    }
    this.setState(next);
  }

  /** Call on pause/stop/tab-hide so a partial batch isn't lost — spec: "flush the remaining amount". */
  flushPendingNow() {
    const next = flushPendingToQueue(this.state);
    if (next !== this.state) this.setState(next);
  }

  /**
   * Best-effort delivery attempt for anything currently queued, using
   * navigator.sendBeacon so it can survive page unload — a plain fetch()
   * started during pagehide/visibilitychange may be cancelled by the
   * browser before it completes (see spec). This never removes items from
   * the local queue on the strength of sendBeacon alone (its return value
   * only means "the browser accepted the request for later delivery", not
   * "the server processed it") — the queue entry is only cleared once a
   * normal sync() gets a real server response, so a duplicate delivery is
   * always possible and always safely deduplicated server-side by its
   * idempotency key.
   */
  flushViaBeacon() {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    if (getCachedSyncConfig().submissionsPaused) return;
    for (const item of this.state.queue) {
      try {
        const blob = new Blob(
          [JSON.stringify({ category: item.category, amount: item.amount, idempotencyKey: item.idempotencyKey })],
          { type: 'application/json' },
        );
        navigator.sendBeacon(`${API_BASE}/api/increment`, blob);
      } catch {
        /* best-effort only */
      }
    }
  }

  async sync(): Promise<void> {
    if (this.syncing) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (!canRetryNow(this.state)) return; // controlled backoff — never retry aggressively

    const config = await getSyncConfig();
    if (config.submissionsPaused) return; // server-directed pause — keep queueing locally only

    this.syncing = true;
    try {
      for (const item of [...this.state.queue]) {
        try {
          const res = await fetch(`${API_BASE}/api/increment`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              category: item.category,
              amount: item.amount,
              idempotencyKey: item.idempotencyKey,
            }),
          });
          // 2xx = accepted; 409 = server already applied this idempotency
          // key on a prior attempt (e.g. a sendBeacon that actually landed).
          // Both mean it is safe to drop locally.
          if (res.ok || res.status === 409) {
            this.setState(recordSyncSuccess(removeFromQueue(this.state, item.idempotencyKey)));
          } else {
            this.setState(recordSyncFailure(this.state));
            break; // stop on first hard failure; retry the rest next cycle
          }
        } catch {
          this.setState(recordSyncFailure(this.state));
          break; // offline or network error — keep queue, back off, retry later
        }
      }
    } finally {
      this.syncing = false;
    }
  }

  /** Resolves once the persisted queue has been loaded — mainly for tests. */
  whenReady(): Promise<void> {
    return this.ready;
  }
}

export const globalTotalsClient = new GlobalTotalsClient();

export async function fetchGlobalTotals(): Promise<GlobalTotals | null> {
  try {
    const res = await fetch(`${API_BASE}/api/totals`);
    if (!res.ok) return null;
    const data = await res.json();
    if (
      typeof data?.chantsAndPrayers !== 'number' ||
      typeof data?.positiveAffirmations !== 'number'
    ) {
      return null;
    }
    return {
      chantsAndPrayers: data.chantsAndPrayers,
      positiveAffirmations: data.positiveAffirmations,
      totalPositiveRepetitions: data.chantsAndPrayers + data.positiveAffirmations,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
