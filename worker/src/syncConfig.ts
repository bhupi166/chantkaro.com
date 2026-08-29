/**
 * Server-controlled adaptive batching configuration. The client polls
 * GET /api/config (cached) instead of hardcoding a batch threshold, so the
 * submit-every-N-repetitions behaviour can change for every visitor without
 * a client redeploy — the whole point being to protect the monthly budget
 * without shipping new frontend code under pressure.
 */

export type SyncMode = 'normal' | 'elevated' | 'high' | 'cost-protection';

export interface ModeProfile {
  mode: SyncMode;
  /** Repetitions accumulated locally before a batch is submitted. */
  batchThreshold: number;
  /** How often clients should re-fetch /api/totals, in seconds. */
  totalsRefreshSeconds: number;
}

// Refresh-interval tiers per spec: normal 30-60s, elevated/high 2-5min,
// cost-protection 10-15min (the spec only names three refresh tiers for
// four batch tiers — "high" reuses the "elevated" refresh interval since
// no distinct one was specified).
export const MODE_PROFILES: Record<SyncMode, ModeProfile> = {
  normal: { mode: 'normal', batchThreshold: 100, totalsRefreshSeconds: 45 },
  elevated: { mode: 'elevated', batchThreshold: 250, totalsRefreshSeconds: 210 },
  high: { mode: 'high', batchThreshold: 500, totalsRefreshSeconds: 210 },
  'cost-protection': { mode: 'cost-protection', batchThreshold: 1000, totalsRefreshSeconds: 750 },
};

export const MODE_ORDER: SyncMode[] = ['normal', 'elevated', 'high', 'cost-protection'];

export interface SyncConfigRow {
  mode: SyncMode;
  batchThreshold: number;
  totalsRefreshSeconds: number;
  submissionsPaused: boolean;
  autoManaged: boolean;
  updatedAt: string;
}

/**
 * Monthly batch-request volume thresholds that trigger an automatic
 * escalation to a more conservative mode (see scheduled() in index.ts).
 * Tuned so that even the top tier stays well inside the Workers Paid
 * plan's included monthly request allowance — see README "Cost model".
 * Deliberately one-directional: auto-escalation can tighten batching, but
 * only an administrator (PATCH /api/admin/config) relaxes it again, so a
 * traffic spike can't silently self-heal back into a risky mode.
 */
export const AUTO_ESCALATION_THRESHOLDS: Record<Exclude<SyncMode, 'normal'>, number> = {
  elevated: 500_000,
  high: 2_000_000,
  'cost-protection': 5_000_000,
};

/** Given this month's batch-request count, what mode should auto-management pick at minimum? */
export function modeForMonthlyBatchCount(monthlyBatchCount: number): SyncMode {
  if (monthlyBatchCount >= AUTO_ESCALATION_THRESHOLDS['cost-protection']) return 'cost-protection';
  if (monthlyBatchCount >= AUTO_ESCALATION_THRESHOLDS.high) return 'high';
  if (monthlyBatchCount >= AUTO_ESCALATION_THRESHOLDS.elevated) return 'elevated';
  return 'normal';
}

/** Never auto-escalates past the current mode — see AUTO_ESCALATION_THRESHOLDS doc. */
export function nextAutoMode(currentMode: SyncMode, monthlyBatchCount: number): SyncMode {
  const suggested = modeForMonthlyBatchCount(monthlyBatchCount);
  const currentIndex = MODE_ORDER.indexOf(currentMode);
  const suggestedIndex = MODE_ORDER.indexOf(suggested);
  return suggestedIndex > currentIndex ? suggested : currentMode;
}

export function isSyncMode(value: unknown): value is SyncMode {
  return typeof value === 'string' && (MODE_ORDER as string[]).includes(value);
}
