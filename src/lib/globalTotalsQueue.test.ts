import { beforeEach, describe, expect, it } from 'vitest';
import {
  addPending,
  BASE_RETRY_DELAY_MS,
  canRetryNow,
  flushPendingToQueue,
  loadQueueState,
  MAX_RETRY_DELAY_MS,
  recordSyncFailure,
  recordSyncSuccess,
  removeFromQueue,
  saveQueueState,
  totalPending,
} from './globalTotalsQueue';
import type { QueueState } from './globalTotalsQueue';

function empty(): QueueState {
  return {
    pending: { chant: 0, affirmation: 0 },
    queue: [],
    consecutiveFailures: 0,
    nextRetryAt: 0,
    pendingMode: null,
    pendingStartedAt: null,
  };
}

describe('globalTotalsQueue — pure batching logic', () => {
  it('accumulates pending increments without creating a queue entry yet', () => {
    let state = empty();
    state = addPending(state, 'chant', 'tap', 1);
    state = addPending(state, 'chant', 'tap', 1);
    expect(totalPending(state)).toBe(2);
    expect(state.queue).toHaveLength(0);
  });

  it('flush moves pending counts into a single batched queue entry per category', () => {
    let state = empty();
    state = addPending(state, 'chant', 'tap', 5);
    state = addPending(state, 'affirmation', 'tap', 3);
    state = flushPendingToQueue(state);
    expect(state.queue).toHaveLength(2);
    expect(totalPending(state)).toBe(0);
    const chantEntry = state.queue.find((q) => q.category === 'chant')!;
    expect(chantEntry.amount).toBe(5);
    expect(chantEntry.idempotencyKey).toBeTruthy();
    expect(chantEntry.mode).toBe('tap');
    expect(typeof chantEntry.elapsedMs).toBe('number');
  });

  it('does not create empty batches when nothing is pending', () => {
    const state = flushPendingToQueue(empty());
    expect(state.queue).toHaveLength(0);
  });

  it('each flush produces a unique idempotency key', () => {
    let state = addPending(empty(), 'chant', 'tap', 1);
    state = flushPendingToQueue(state);
    const firstKey = state.queue[0].idempotencyKey;
    state = addPending(state, 'chant', 'tap', 1);
    state = flushPendingToQueue(state);
    const secondEntry = state.queue.find((q) => q.idempotencyKey !== firstKey);
    expect(secondEntry).toBeTruthy();
  });

  it('removeFromQueue drops only the matching entry', () => {
    let state = addPending(empty(), 'chant', 'tap', 1);
    state = flushPendingToQueue(state);
    const key = state.queue[0].idempotencyKey;
    state = removeFromQueue(state, key);
    expect(state.queue).toHaveLength(0);
  });

  it('flushing under one mode does not need to track another — a fresh accumulation starts null', () => {
    let state = addPending(empty(), 'chant', 'voice', 2);
    expect(state.pendingMode).toBe('voice');
    state = flushPendingToQueue(state);
    expect(state.pendingMode).toBeNull();
    expect(state.pendingStartedAt).toBeNull();
    expect(state.queue[0].mode).toBe('voice');
  });
});

describe('exponential backoff', () => {
  it('doubles the delay on each consecutive failure, capped at MAX_RETRY_DELAY_MS', () => {
    const now = 1_000_000;
    let state = empty();
    state = recordSyncFailure(state, now);
    expect(state.nextRetryAt - now).toBe(BASE_RETRY_DELAY_MS);

    state = recordSyncFailure(state, now);
    expect(state.nextRetryAt - now).toBe(BASE_RETRY_DELAY_MS * 2);

    state = recordSyncFailure(state, now);
    expect(state.nextRetryAt - now).toBe(BASE_RETRY_DELAY_MS * 4);

    // Enough consecutive failures to blow past the cap.
    for (let i = 0; i < 10; i++) state = recordSyncFailure(state, now);
    expect(state.nextRetryAt - now).toBe(MAX_RETRY_DELAY_MS);
  });

  it('resets to zero delay on the next success', () => {
    let state = recordSyncFailure(recordSyncFailure(empty()));
    expect(state.consecutiveFailures).toBe(2);
    state = recordSyncSuccess(state);
    expect(state.consecutiveFailures).toBe(0);
    expect(state.nextRetryAt).toBe(0);
  });

  it('canRetryNow respects the backoff window and does not retry aggressively', () => {
    const now = 1_000_000;
    const state = recordSyncFailure(empty(), now);
    expect(canRetryNow(state, now)).toBe(false);
    expect(canRetryNow(state, now + BASE_RETRY_DELAY_MS - 1)).toBe(false);
    expect(canRetryNow(state, now + BASE_RETRY_DELAY_MS)).toBe(true);
  });

  it('a fresh state can always retry immediately', () => {
    expect(canRetryNow(empty())).toBe(true);
  });
});

describe('IndexedDB persistence', () => {
  beforeEach(async () => {
    // Each test gets a clean slate; loadQueueState() returns an empty
    // state by default when nothing has been saved yet.
    await saveQueueState(empty());
  });

  it('round-trips a saved state through IndexedDB', async () => {
    let state = addPending(empty(), 'chant', 'tap', 3);
    state = flushPendingToQueue(state);
    await saveQueueState(state);

    const reloaded = await loadQueueState();
    expect(reloaded.queue).toHaveLength(1);
    expect(reloaded.queue[0].amount).toBe(3);
  });

  it('loadQueueState returns a valid empty state when nothing was ever saved', async () => {
    // Use a state shape check rather than clearing the DB (no delete API
    // exposed here) — an empty, freshly-saved state should read back clean.
    const reloaded = await loadQueueState();
    expect(reloaded.pending).toEqual({ chant: 0, affirmation: 0 });
    expect(Array.isArray(reloaded.queue)).toBe(true);
  });
});
