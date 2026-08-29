import { API_BASE } from './env';
import {
  addPending,
  BATCH_SIZE_THRESHOLD,
  flushPendingToQueue,
  loadQueueState,
  removeFromQueue,
  saveQueueState,
  totalPending,
  type QueueState,
} from './globalTotalsQueue';
import type { GlobalTotals, PracticeCategory } from './types';

const FLUSH_INTERVAL_MS = 30_000;

type Listener = (state: QueueState) => void;

/**
 * Owns the anonymous-contribution queue: batches repetitions locally, syncs
 * batches to the Worker API with idempotency keys, and never transmits
 * anything beyond a category and a positive integer amount.
 */
class GlobalTotalsClient {
  private state: QueueState = loadQueueState();
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private syncing = false;

  private setState(next: QueueState) {
    this.state = next;
    saveQueueState(next);
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
    this.timer = setInterval(() => this.flushAndSync(), FLUSH_INTERVAL_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
    }
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
    void this.flushAndSync();
  };

  /** Records one repetition locally; flushes to a queued batch at the threshold. */
  record(category: PracticeCategory, contributionEnabled: boolean) {
    if (!contributionEnabled) return;
    let next = addPending(this.state, category, 1);
    if (totalPending(next) >= BATCH_SIZE_THRESHOLD) {
      next = flushPendingToQueue(next);
    }
    this.setState(next);
  }

  /** Call on pause/stop/navigation-away so partial batches aren't lost. */
  flushPendingNow() {
    const next = flushPendingToQueue(this.state);
    if (next !== this.state) this.setState(next);
  }

  async flushAndSync(): Promise<void> {
    this.flushPendingNow();
    await this.sync();
  }

  async sync(): Promise<void> {
    if (this.syncing) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
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
          // key on a prior attempt. Both mean it is safe to drop locally.
          if (res.ok || res.status === 409) {
            this.setState(removeFromQueue(this.state, item.idempotencyKey));
          } else {
            break; // stop on first hard failure, retry whole queue next cycle
          }
        } catch {
          break; // offline or network error — keep queue, retry later
        }
      }
    } finally {
      this.syncing = false;
    }
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
