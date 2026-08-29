import { isSyncMode, MODE_PROFILES, type SyncConfigRow, type SyncMode } from './syncConfig';

export interface DbEnv {
  DB: D1Database;
}

/** Idempotency records only need to survive as long as a client might retry a batch. */
export const IDEMPOTENCY_RETENTION_HOURS = 60; // within the 48-72h window from spec

export async function getSyncConfig(env: DbEnv): Promise<SyncConfigRow> {
  const row = await env.DB.prepare(
    `SELECT mode, batch_threshold, totals_refresh_seconds, submissions_paused, auto_managed, updated_at
     FROM sync_config WHERE id = 1`,
  ).first<{
    mode: string;
    batch_threshold: number;
    totals_refresh_seconds: number;
    submissions_paused: number;
    auto_managed: number;
    updated_at: string;
  }>();

  if (!row) {
    // Table exists (migration applied) but the seed row is somehow missing —
    // fall back to the safe default rather than 500ing the whole endpoint.
    const fallback = MODE_PROFILES.normal;
    return {
      mode: fallback.mode,
      batchThreshold: fallback.batchThreshold,
      totalsRefreshSeconds: fallback.totalsRefreshSeconds,
      submissionsPaused: false,
      autoManaged: true,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    mode: isSyncMode(row.mode) ? row.mode : 'normal',
    batchThreshold: row.batch_threshold,
    totalsRefreshSeconds: row.totals_refresh_seconds,
    submissionsPaused: row.submissions_paused === 1,
    autoManaged: row.auto_managed === 1,
    updatedAt: row.updated_at,
  };
}

export interface SyncConfigPatch {
  mode?: SyncMode;
  batchThreshold?: number;
  totalsRefreshSeconds?: number;
  submissionsPaused?: boolean;
  autoManaged?: boolean;
}

export async function updateSyncConfig(env: DbEnv, patch: SyncConfigPatch): Promise<SyncConfigRow> {
  const current = await getSyncConfig(env);
  const next: SyncConfigRow = {
    mode: patch.mode ?? current.mode,
    batchThreshold: patch.batchThreshold ?? current.batchThreshold,
    totalsRefreshSeconds: patch.totalsRefreshSeconds ?? current.totalsRefreshSeconds,
    submissionsPaused: patch.submissionsPaused ?? current.submissionsPaused,
    autoManaged: patch.autoManaged ?? current.autoManaged,
    updatedAt: new Date().toISOString(),
  };
  await env.DB.prepare(
    `UPDATE sync_config
     SET mode = ?1, batch_threshold = ?2, totals_refresh_seconds = ?3,
         submissions_paused = ?4, auto_managed = ?5, updated_at = ?6
     WHERE id = 1`,
  )
    .bind(
      next.mode,
      next.batchThreshold,
      next.totalsRefreshSeconds,
      next.submissionsPaused ? 1 : 0,
      next.autoManaged ? 1 : 0,
      next.updatedAt,
    )
    .run();
  return next;
}

export async function pruneExpiredIdempotencyKeys(env: DbEnv): Promise<number> {
  const cutoff = new Date(Date.now() - IDEMPOTENCY_RETENTION_HOURS * 60 * 60 * 1000).toISOString();
  const result = await env.DB.prepare('DELETE FROM idempotency_keys WHERE created_at < ?1')
    .bind(cutoff)
    .run();
  return result.meta?.changes ?? 0;
}

export async function countBatchesSince(env: DbEnv, sinceIso: string): Promise<number> {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM idempotency_keys WHERE created_at >= ?1',
  )
    .bind(sinceIso)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Logs a single warning line when estimated storage usage falls within a
 * narrow band just above 50%, 70% or 85% of the D1 paid-plan included
 * limit. Workers have no reliable way to remember "did we already warn
 * about this?" across cron invocations (isolates aren't guaranteed to
 * persist), so this uses a narrow crossing-band instead of persisted
 * state — an approximation that logs a handful of times around a
 * crossing rather than once per hour forever, keeping with "minimize
 * production logging". Authoritative storage numbers are always the
 * Cloudflare D1 dashboard, not this estimate.
 */
const STORAGE_WARNING_BANDS: [number, number][] = [
  [85, 87],
  [70, 72],
  [50, 52],
];

/** Pure so the banding logic is testable without needing millions of fake rows. */
export function storageWarningMessage(percent: number): string | null {
  for (const [low, high] of STORAGE_WARNING_BANDS) {
    if (percent >= low && percent < high) {
      return `D1 estimated storage at ~${percent.toFixed(1)}% of the included limit (crossed ${low}%). Check the Cloudflare D1 dashboard for the authoritative figure.`;
    }
  }
  return null;
}

export async function checkStorageThresholds(env: DbEnv): Promise<void> {
  const snapshot = await getUsageSnapshot(env);
  const message = storageWarningMessage(snapshot.estimatedStorage.percentOfIncluded);
  if (message) console.warn(message);
}

export function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Cheap technical-usage snapshot for the admin endpoint. Row counts are
 * exact (simple COUNT queries); "approximate storage" is estimated from
 * row counts rather than queried directly, since D1 doesn't expose a cheap
 * per-request storage-size call — treat it as a rough indicator, not a
 * bill. For authoritative requests/CPU-time/storage figures, use the
 * Cloudflare dashboard (Workers & D1 analytics) — re-measuring those here
 * would itself add the kind of extra reads/writes this design avoids.
 */
export async function getUsageSnapshot(env: DbEnv) {
  const [totals, idempotencyCount, rateLimitCount, monthlyBatches, config] = await Promise.all([
    env.DB.prepare('SELECT category, count FROM totals').all<{ category: string; count: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM idempotency_keys').first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM rate_limits').first<{ n: number }>(),
    countBatchesSince(env, startOfCurrentMonthIso()),
    getSyncConfig(env),
  ]);

  // Very rough per-row size estimate (TEXT primary key + a few small
  // columns) purely to give an early, order-of-magnitude storage signal —
  // see the docstring above for why this isn't authoritative.
  const estimatedIdempotencyBytes = (idempotencyCount?.n ?? 0) * 96;
  const estimatedRateLimitBytes = (rateLimitCount?.n ?? 0) * 64;
  const estimatedTotalBytes = estimatedIdempotencyBytes + estimatedRateLimitBytes;
  const d1IncludedBytes = 5 * 1024 * 1024 * 1024; // D1 paid-plan included storage, see README
  const estimatedStoragePercent = (estimatedTotalBytes / d1IncludedBytes) * 100;

  return {
    totals: Object.fromEntries((totals.results ?? []).map((r) => [r.category, r.count])),
    idempotencyKeyRows: idempotencyCount?.n ?? 0,
    rateLimitRows: rateLimitCount?.n ?? 0,
    batchesThisMonth: monthlyBatches,
    config,
    estimatedStorage: {
      bytes: estimatedTotalBytes,
      percentOfIncluded: Number(estimatedStoragePercent.toFixed(3)),
      note: 'Rough estimate from row counts, not an authoritative reading — check the Cloudflare D1 dashboard for real storage usage.',
    },
    generatedAt: new Date().toISOString(),
  };
}
