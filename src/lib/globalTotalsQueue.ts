import { loadQueueRecord, saveQueueRecord } from './offlineQueueDb';
import type { CountingMode, PracticeCategory, QueuedIncrement } from './types';

/** Legacy key from before the IndexedDB migration — read once, then cleared. */
const LEGACY_LOCALSTORAGE_KEY = 'chantkaro:queue:v1';

export interface QueueState {
  pending: Record<PracticeCategory, number>;
  queue: QueuedIncrement[];
  /** Consecutive failed sync attempts, driving exponential backoff. */
  consecutiveFailures: number;
  /** Epoch ms — don't attempt another sync before this time. */
  nextRetryAt: number;
  /** Counting method for whatever is currently accumulating in `pending` — a batch is never mixed-mode. */
  pendingMode: CountingMode | null;
  /** Epoch ms of the first repetition since the last flush — used to compute a batch's elapsedMs. */
  pendingStartedAt: number | null;
}

function emptyState(): QueueState {
  return {
    pending: { chant: 0, affirmation: 0 },
    queue: [],
    consecutiveFailures: 0,
    nextRetryAt: 0,
    pendingMode: null,
    pendingStartedAt: null,
  };
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalize(raw: unknown): QueueState {
  if (!raw || typeof raw !== 'object') return emptyState();
  const parsed = raw as Partial<QueueState> & { pending?: Partial<Record<PracticeCategory, number>> };
  return {
    pending: {
      chant: parsed.pending?.chant ?? 0,
      affirmation: parsed.pending?.affirmation ?? 0,
    },
    queue: Array.isArray(parsed.queue) ? parsed.queue : [],
    consecutiveFailures:
      typeof parsed.consecutiveFailures === 'number' ? parsed.consecutiveFailures : 0,
    nextRetryAt: typeof parsed.nextRetryAt === 'number' ? parsed.nextRetryAt : 0,
    pendingMode: parsed.pendingMode === 'tap' || parsed.pendingMode === 'voice' ? parsed.pendingMode : null,
    pendingStartedAt: typeof parsed.pendingStartedAt === 'number' ? parsed.pendingStartedAt : null,
  };
}

/**
 * Loads the queue from IndexedDB. On first run after upgrading from the
 * old LocalStorage-backed queue, migrates any leftover data across exactly
 * once so nobody's already-queued anonymous batches are silently dropped.
 */
export async function loadQueueState(): Promise<QueueState> {
  const fromIndexedDb = await loadQueueRecord<QueueState>();
  if (fromIndexedDb) return normalize(fromIndexedDb);

  try {
    const legacyRaw = window.localStorage?.getItem(LEGACY_LOCALSTORAGE_KEY);
    if (legacyRaw) {
      const migrated = normalize(JSON.parse(legacyRaw));
      await saveQueueRecord(migrated);
      window.localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
      return migrated;
    }
  } catch {
    /* corrupted legacy data — fall through to a fresh state */
  }
  return emptyState();
}

/** Best-effort persistence — a failure here never throws or blocks counting. */
export async function saveQueueState(state: QueueState): Promise<void> {
  await saveQueueRecord(state);
}

export function addPending(
  state: QueueState,
  category: PracticeCategory,
  mode: CountingMode,
  amount = 1,
  now = Date.now(),
): QueueState {
  return {
    ...state,
    pending: { ...state.pending, [category]: state.pending[category] + amount },
    pendingMode: mode,
    pendingStartedAt: state.pendingStartedAt ?? now,
  };
}

/** Moves any non-zero pending counters into new, uniquely-keyed queue batches. */
export function flushPendingToQueue(state: QueueState, now = Date.now()): QueueState {
  const mode = state.pendingMode ?? 'tap';
  const elapsedMs = state.pendingStartedAt != null ? Math.max(0, now - state.pendingStartedAt) : 0;
  const newEntries: QueuedIncrement[] = [];
  (['chant', 'affirmation'] as const).forEach((category) => {
    const amount = state.pending[category];
    if (amount > 0) {
      newEntries.push({
        idempotencyKey: uid(),
        category,
        amount,
        queuedAt: new Date(now).toISOString(),
        mode,
        elapsedMs,
      });
    }
  });
  if (newEntries.length === 0) return state;
  return {
    ...state,
    pending: { chant: 0, affirmation: 0 },
    pendingMode: null,
    pendingStartedAt: null,
    queue: [...state.queue, ...newEntries],
  };
}

export function removeFromQueue(state: QueueState, idempotencyKey: string): QueueState {
  return { ...state, queue: state.queue.filter((q) => q.idempotencyKey !== idempotencyKey) };
}

export function totalPending(state: QueueState): number {
  return state.pending.chant + state.pending.affirmation;
}

// --- Exponential backoff for failed batch syncs ---
// Deliberately capped and modest: 30s, 60s, 120s, 240s, ... up to 30 min.
// "Do not retry continuously or aggressively" — see spec.
export const BASE_RETRY_DELAY_MS = 30_000;
export const MAX_RETRY_DELAY_MS = 30 * 60_000;

export function recordSyncFailure(state: QueueState, now = Date.now()): QueueState {
  const failures = state.consecutiveFailures + 1;
  const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** (failures - 1), MAX_RETRY_DELAY_MS);
  return { ...state, consecutiveFailures: failures, nextRetryAt: now + delay };
}

export function recordSyncSuccess(state: QueueState): QueueState {
  if (state.consecutiveFailures === 0 && state.nextRetryAt === 0) return state;
  return { ...state, consecutiveFailures: 0, nextRetryAt: 0 };
}

export function canRetryNow(state: QueueState, now = Date.now()): boolean {
  return now >= state.nextRetryAt;
}
