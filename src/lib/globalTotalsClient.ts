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
import { getCachedSessionToken, getSessionToken, invalidateSessionToken, type SessionInfo } from './sessionClient';
import type { GlobalTotals, PracticeCategory, PracticeMode } from './types';

/** How often the client checks whether anything queued is worth (re)sending. Not itself a guaranteed request — gated by queue contents + backoff. */
const SYNC_CHECK_INTERVAL_MS = 30_000;

type Listener = (state: QueueState) => void;
/** Shows a challenge (e.g. a Turnstile widget) for the given site key and resolves with its token, or null if abandoned/failed. */
type ChallengeSolver = (turnstileSiteKey: string | null) => Promise<string | null>;

/**
 * Owns the anonymous-contribution queue: batches repetitions locally
 * (server-configured threshold — see syncConfigClient.ts — defaulting to
 * one batch per 100 repetitions), persists them in IndexedDB, and syncs to
 * the Worker API with a signed session token, idempotency keys and
 * controlled exponential backoff. Never transmits anything beyond a
 * category, a positive integer amount, and the timing/mode metadata the
 * server uses for abuse detection — never blocks or loses personal
 * counting, which lives entirely outside this module.
 */
class GlobalTotalsClient {
  private state: QueueState = {
    pending: { chant: 0, affirmation: 0 },
    queue: [],
    consecutiveFailures: 0,
    nextRetryAt: 0,
    pendingMode: null,
    pendingStartedAt: null,
  };
  private ready: Promise<void>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private syncing = false;
  private challengeSolver: ChallengeSolver | null = null;

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

  /** Registers the UI's challenge presenter (see TurnstileChallenge). Without one, a 428 just backs off and retries later. */
  setChallengeSolver(solver: ChallengeSolver | null) {
    this.challengeSolver = solver;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => void this.sync(), SYNC_CHECK_INTERVAL_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
    }
    void getSyncConfig(); // warm the config cache early, off the hot tap path
    void getSessionToken(); // and the session, so the first real batch doesn't wait on it
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
   * call the server after every repetition"). A batch is never mixed-mode:
   * switching between Tap and Voice mid-session flushes whatever was
   * accumulating first.
   */
  record(category: PracticeCategory, contributionEnabled: boolean, mode: PracticeMode = 'tap') {
    if (!contributionEnabled) return;
    let state = this.state;
    if (state.pendingMode && state.pendingMode !== mode && totalPending(state) > 0) {
      state = flushPendingToQueue(state);
    }
    let next = addPending(state, category, mode, 1);
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
   * browser before it completes (see spec). sendBeacon cannot set custom
   * headers, so the session token — if one happens to already be cached —
   * travels as a `?token=` query parameter instead (accepted server-side
   * as a fallback only for this reason). This never removes items from
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
    const session = getCachedSessionToken();
    if (!session) return; // no cached token, no header support — nothing safe to send
    for (const item of this.state.queue) {
      try {
        const blob = new Blob(
          [
            JSON.stringify({
              category: item.category,
              amount: item.amount,
              idempotencyKey: item.idempotencyKey,
              elapsedMs: item.elapsedMs,
              mode: item.mode,
            }),
          ],
          { type: 'application/json' },
        );
        navigator.sendBeacon(`${API_BASE}/api/increment?token=${encodeURIComponent(session.token)}`, blob);
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

    const session = await getSessionToken();
    if (!session) return; // session service unreachable — try again next cycle, not a queue failure

    this.syncing = true;
    try {
      for (const item of [...this.state.queue]) {
        const outcome = await this.syncOne(item.idempotencyKey, session);
        if (outcome === 'stop') break;
      }
    } finally {
      this.syncing = false;
    }
  }

  /** Sends one queued batch, handling success, safe-drop rejection, a challenge, or a retryable failure. */
  private async syncOne(
    idempotencyKey: string,
    session: SessionInfo,
    turnstileToken?: string,
  ): Promise<'continue' | 'stop'> {
    const item = this.state.queue.find((q) => q.idempotencyKey === idempotencyKey);
    if (!item) return 'continue'; // already removed by a prior iteration

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/increment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          category: item.category,
          amount: item.amount,
          idempotencyKey: item.idempotencyKey,
          elapsedMs: item.elapsedMs,
          mode: item.mode,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });
    } catch {
      this.setState(recordSyncFailure(this.state));
      return 'stop'; // offline or network error — keep queue, back off, retry later
    }

    // 2xx = accepted; 409 = server already applied this idempotency key on
    // a prior attempt (e.g. a sendBeacon that actually landed). Both mean
    // it is safe to drop locally.
    if (res.ok || res.status === 409) {
      this.setState(recordSyncSuccess(removeFromQueue(this.state, item.idempotencyKey)));
      return 'continue';
    }

    // Rejected or quarantined by the server's speed/pattern checks, or a
    // failed challenge: never applied to the global total, and never
    // retried — the caller's local/personal count is untouched by this.
    if (res.status === 422 || res.status === 403) {
      this.setState(removeFromQueue(this.state, item.idempotencyKey));
      return 'continue';
    }

    if (res.status === 428) {
      let siteKey: string | null = session.turnstileSiteKey;
      try {
        const body = (await res.json()) as { turnstileSiteKey?: string | null };
        if (typeof body.turnstileSiteKey === 'string') siteKey = body.turnstileSiteKey;
      } catch {
        /* fall back to the site key from session-start */
      }
      const solvedToken = await this.solveChallenge(siteKey);
      if (solvedToken) {
        return this.syncOne(idempotencyKey, session, solvedToken);
      }
      this.setState(recordSyncFailure(this.state));
      return 'stop'; // no solver mounted (or user abandoned it) — try again next cycle
    }

    if (res.status === 401) {
      invalidateSessionToken(); // the token was invalid/expired — force a fresh one next attempt
      this.setState(recordSyncFailure(this.state));
      return 'stop';
    }

    this.setState(recordSyncFailure(this.state));
    return 'stop';
  }

  private async solveChallenge(siteKey: string | null): Promise<string | null> {
    if (!this.challengeSolver) return null;
    try {
      return await this.challengeSolver(siteKey);
    } catch {
      return null;
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
