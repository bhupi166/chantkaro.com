import { describe, expect, it } from 'vitest';
import {
  addPending,
  flushPendingToQueue,
  removeFromQueue,
  totalPending,
} from './globalTotalsQueue';
import type { QueueState } from './globalTotalsQueue';

function empty(): QueueState {
  return { pending: { chant: 0, affirmation: 0 }, queue: [] };
}

describe('globalTotalsQueue', () => {
  it('accumulates pending increments without creating a queue entry yet', () => {
    let state = empty();
    state = addPending(state, 'chant', 1);
    state = addPending(state, 'chant', 1);
    expect(totalPending(state)).toBe(2);
    expect(state.queue).toHaveLength(0);
  });

  it('flush moves pending counts into a single batched queue entry per category', () => {
    let state = empty();
    state = addPending(state, 'chant', 5);
    state = addPending(state, 'affirmation', 3);
    state = flushPendingToQueue(state);
    expect(state.queue).toHaveLength(2);
    expect(totalPending(state)).toBe(0);
    const chantEntry = state.queue.find((q) => q.category === 'chant')!;
    expect(chantEntry.amount).toBe(5);
    expect(chantEntry.idempotencyKey).toBeTruthy();
  });

  it('does not create empty batches when nothing is pending', () => {
    const state = flushPendingToQueue(empty());
    expect(state.queue).toHaveLength(0);
  });

  it('each flush produces a unique idempotency key', () => {
    let state = addPending(empty(), 'chant', 1);
    state = flushPendingToQueue(state);
    const firstKey = state.queue[0].idempotencyKey;
    state = addPending(state, 'chant', 1);
    state = flushPendingToQueue(state);
    const secondEntry = state.queue.find((q) => q.idempotencyKey !== firstKey);
    expect(secondEntry).toBeTruthy();
  });

  it('removeFromQueue drops only the matching entry', () => {
    let state = addPending(empty(), 'chant', 1);
    state = flushPendingToQueue(state);
    const key = state.queue[0].idempotencyKey;
    state = removeFromQueue(state, key);
    expect(state.queue).toHaveLength(0);
  });
});
