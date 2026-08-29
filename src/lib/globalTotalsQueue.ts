import type { PracticeCategory, QueuedIncrement } from './types';

const STORAGE_KEY = 'chantkaro:queue:v1';

export interface QueueState {
  pending: Record<PracticeCategory, number>;
  queue: QueuedIncrement[];
}

function emptyState(): QueueState {
  return { pending: { chant: 0, affirmation: 0 }, queue: [] };
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadQueueState(): QueueState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return {
      pending: { chant: parsed.pending?.chant ?? 0, affirmation: parsed.pending?.affirmation ?? 0 },
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
    };
  } catch {
    return emptyState();
  }
}

export function saveQueueState(state: QueueState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* best-effort; personal counting never depends on this succeeding */
  }
}

export function addPending(state: QueueState, category: PracticeCategory, amount = 1): QueueState {
  return {
    ...state,
    pending: { ...state.pending, [category]: state.pending[category] + amount },
  };
}

/** Moves any non-zero pending counters into new, uniquely-keyed queue batches. */
export function flushPendingToQueue(state: QueueState): QueueState {
  const newEntries: QueuedIncrement[] = [];
  (['chant', 'affirmation'] as const).forEach((category) => {
    const amount = state.pending[category];
    if (amount > 0) {
      newEntries.push({
        idempotencyKey: uid(),
        category,
        amount,
        queuedAt: new Date().toISOString(),
      });
    }
  });
  if (newEntries.length === 0) return state;
  return {
    pending: { chant: 0, affirmation: 0 },
    queue: [...state.queue, ...newEntries],
  };
}

export function removeFromQueue(state: QueueState, idempotencyKey: string): QueueState {
  return { ...state, queue: state.queue.filter((q) => q.idempotencyKey !== idempotencyKey) };
}

export const BATCH_SIZE_THRESHOLD = 15;

export function totalPending(state: QueueState): number {
  return state.pending.chant + state.pending.affirmation;
}
