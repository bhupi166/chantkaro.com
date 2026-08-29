import { sha256Hex } from './rateLimit';

export interface SecurityEnv {
  DB: D1Database;
}

export interface SecurityConfig {
  maxTapRatePerSecond: number;
  maxVoiceRatePerSecond: number;
  sessionTtlSeconds: number;
  challengeSuspicionThreshold: number;
  abuseLockdown: boolean;
}

export interface AbuseMetrics {
  challengesIssued: number;
  challengesPassed: number;
  batchesRejectedSpeed: number;
  batchesRejectedPattern: number;
  batchesRejectedAuth: number;
}

interface SecurityConfigRow {
  max_tap_rate_per_second: number;
  max_voice_rate_per_second: number;
  session_ttl_seconds: number;
  challenge_suspicion_threshold: number;
  abuse_lockdown: number;
  challenges_issued: number;
  challenges_passed: number;
  batches_rejected_speed: number;
  batches_rejected_pattern: number;
  batches_rejected_auth: number;
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxTapRatePerSecond: 8,
  maxVoiceRatePerSecond: 2,
  sessionTtlSeconds: 21_600,
  challengeSuspicionThreshold: 5,
  abuseLockdown: false,
};

export async function getSecurityConfig(env: SecurityEnv): Promise<SecurityConfig> {
  const row = await env.DB.prepare(
    `SELECT max_tap_rate_per_second, max_voice_rate_per_second, session_ttl_seconds,
            challenge_suspicion_threshold, abuse_lockdown
     FROM security_config WHERE id = 1`,
  ).first<SecurityConfigRow>();
  if (!row) return DEFAULT_SECURITY_CONFIG;
  return {
    maxTapRatePerSecond: row.max_tap_rate_per_second,
    maxVoiceRatePerSecond: row.max_voice_rate_per_second,
    sessionTtlSeconds: row.session_ttl_seconds,
    challengeSuspicionThreshold: row.challenge_suspicion_threshold,
    abuseLockdown: row.abuse_lockdown === 1,
  };
}

export interface SecurityConfigPatch {
  maxTapRatePerSecond?: number;
  maxVoiceRatePerSecond?: number;
  sessionTtlSeconds?: number;
  challengeSuspicionThreshold?: number;
  abuseLockdown?: boolean;
}

export async function updateSecurityConfig(
  env: SecurityEnv,
  patch: SecurityConfigPatch,
): Promise<SecurityConfig> {
  const current = await getSecurityConfig(env);
  const next: SecurityConfig = { ...current, ...patch };
  await env.DB.prepare(
    `UPDATE security_config
     SET max_tap_rate_per_second = ?1, max_voice_rate_per_second = ?2, session_ttl_seconds = ?3,
         challenge_suspicion_threshold = ?4, abuse_lockdown = ?5, updated_at = ?6
     WHERE id = 1`,
  )
    .bind(
      next.maxTapRatePerSecond,
      next.maxVoiceRatePerSecond,
      next.sessionTtlSeconds,
      next.challengeSuspicionThreshold,
      next.abuseLockdown ? 1 : 0,
      new Date().toISOString(),
    )
    .run();
  return next;
}

export async function getAbuseMetrics(env: SecurityEnv): Promise<AbuseMetrics> {
  const row = await env.DB.prepare(
    `SELECT challenges_issued, challenges_passed, batches_rejected_speed,
            batches_rejected_pattern, batches_rejected_auth
     FROM security_config WHERE id = 1`,
  ).first<SecurityConfigRow>();
  return {
    challengesIssued: row?.challenges_issued ?? 0,
    challengesPassed: row?.challenges_passed ?? 0,
    batchesRejectedSpeed: row?.batches_rejected_speed ?? 0,
    batchesRejectedPattern: row?.batches_rejected_pattern ?? 0,
    batchesRejectedAuth: row?.batches_rejected_auth ?? 0,
  };
}

type AbuseMetricColumn =
  | 'challenges_issued'
  | 'challenges_passed'
  | 'batches_rejected_speed'
  | 'batches_rejected_pattern'
  | 'batches_rejected_auth';

/** Column name is a fixed internal literal at every call site, never user input — safe to interpolate. */
export async function incrementAbuseMetric(env: SecurityEnv, column: AbuseMetricColumn): Promise<void> {
  await env.DB.prepare(`UPDATE security_config SET ${column} = ${column} + 1 WHERE id = 1`).run();
}

// --- Sessions ---

export interface SessionRow {
  sessionId: string;
  expiresAt: string;
  deviceHash: string;
  suspicionScore: number;
  challengeRequired: boolean;
  lastBatchAt: string | null;
  lastIntervalMs: number | null;
  patternStreak: number;
}

interface SessionDbRow {
  session_id: string;
  expires_at: string;
  device_hash: string;
  suspicion_score: number;
  challenge_required: number;
  last_batch_at: string | null;
  last_interval_ms: number | null;
  pattern_streak: number;
}

function fromDbRow(row: SessionDbRow): SessionRow {
  return {
    sessionId: row.session_id,
    expiresAt: row.expires_at,
    deviceHash: row.device_hash,
    suspicionScore: row.suspicion_score,
    challengeRequired: row.challenge_required === 1,
    lastBatchAt: row.last_batch_at,
    lastIntervalMs: row.last_interval_ms,
    patternStreak: row.pattern_streak,
  };
}

/** deviceId is a random, non-identifying client-generated string — never real device/browser fingerprinting. */
export async function hashSubject(subject: string): Promise<string> {
  return sha256Hex(subject);
}

export async function createSession(
  env: SecurityEnv,
  sessionId: string,
  ipHash: string,
  deviceHash: string,
  ttlSeconds: number,
): Promise<string> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (session_id, expires_at, ip_hash, device_hash) VALUES (?1, ?2, ?3, ?4)`,
  )
    .bind(sessionId, expiresAt, ipHash, deviceHash)
    .run();
  return expiresAt;
}

export async function getSession(env: SecurityEnv, sessionId: string): Promise<SessionRow | null> {
  const row = await env.DB.prepare(
    `SELECT session_id, expires_at, device_hash, suspicion_score, challenge_required, last_batch_at, last_interval_ms, pattern_streak
     FROM sessions WHERE session_id = ?1`,
  )
    .bind(sessionId)
    .first<SessionDbRow>();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null; // lazily treat as gone
  return fromDbRow(row);
}

export interface SessionTrackingUpdate {
  suspicionScore: number;
  challengeRequired: boolean;
  patternStreak: number;
  lastBatchAtIso: string;
  lastIntervalMs: number | null;
}

export async function updateSessionTracking(
  env: SecurityEnv,
  sessionId: string,
  update: SessionTrackingUpdate,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE sessions
     SET suspicion_score = ?1, challenge_required = ?2, pattern_streak = ?3,
         last_batch_at = ?4, last_interval_ms = ?5
     WHERE session_id = ?6`,
  )
    .bind(
      update.suspicionScore,
      update.challengeRequired ? 1 : 0,
      update.patternStreak,
      update.lastBatchAtIso,
      update.lastIntervalMs,
      sessionId,
    )
    .run();
}

/** Called after a Turnstile challenge is solved successfully — clears the flag and resets scoring. */
export async function resolveChallenge(env: SecurityEnv, sessionId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE sessions SET challenge_required = 0, suspicion_score = 0, pattern_streak = 0 WHERE session_id = ?1`,
  )
    .bind(sessionId)
    .run();
}

export async function pruneExpiredSessions(env: SecurityEnv): Promise<number> {
  const result = await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?1')
    .bind(new Date().toISOString())
    .run();
  return result.meta?.changes ?? 0;
}

// --- Batch speed/pattern evaluation ---

/** Batches smaller than this are too noisy a sample to judge a rate from — never flagged on speed alone. */
export const MIN_AMOUNT_FOR_SPEED_CHECK = 3;
/** Intervals within this many ms of the previous one count as "suspiciously identical". */
export const PATTERN_TOLERANCE_MS = 20;
/** Consecutive near-identical intervals before a pattern is flagged as robotic. */
export const PATTERN_STREAK_THRESHOLD = 3;

export type BatchEvaluation =
  | { verdict: 'ok' }
  | { verdict: 'reject'; reason: 'speed' | 'pattern' }
  | { verdict: 'challenge' };

export interface BatchEvaluationInput {
  mode: 'tap' | 'voice';
  amount: number;
  elapsedMs: number;
  now: Date;
  session: SessionRow;
  config: SecurityConfig;
}

/**
 * Pure evaluation of one batch against speed and timing-pattern rules,
 * given the session's prior state. Returns what *should* happen; the
 * caller (index.ts) is responsible for actually persisting any session
 * updates and metric increments, keeping this function trivially testable.
 */
export function evaluateBatch(input: BatchEvaluationInput): {
  verdict: BatchEvaluation;
  patternStreak: number;
  intervalMs: number | null;
  suspicionDelta: number;
} {
  const { mode, amount, elapsedMs, now, session, config } = input;

  const intervalMs = session.lastBatchAt
    ? now.getTime() - new Date(session.lastBatchAt).getTime()
    : null;

  let patternStreak = 0;
  let suspicionDelta = 0;
  let patternViolated = false;
  let speedViolated = false;

  if (
    intervalMs != null &&
    session.lastIntervalMs != null &&
    Math.abs(intervalMs - session.lastIntervalMs) <= PATTERN_TOLERANCE_MS
  ) {
    patternStreak = session.patternStreak + 1;
  }
  if (patternStreak >= PATTERN_STREAK_THRESHOLD) {
    suspicionDelta += 3;
    patternViolated = true;
  }

  if (amount >= MIN_AMOUNT_FOR_SPEED_CHECK) {
    const maxRate = mode === 'voice' ? config.maxVoiceRatePerSecond : config.maxTapRatePerSecond;
    const effectiveElapsedSeconds = Math.max(elapsedMs, 1) / 1000;
    const rate = amount / effectiveElapsedSeconds;
    if (rate > maxRate) {
      suspicionDelta += 2;
      speedViolated = true;
    }
  }

  // A single occasional anomaly is quietly rejected (never applied, no
  // friction shown); only once cumulative suspicion crosses the threshold
  // does the session earn an interactive challenge — that priority order is
  // what makes this "progressive" rather than a hard, permanent block.
  const projectedSuspicion = session.suspicionScore + suspicionDelta;
  if (!session.challengeRequired && projectedSuspicion >= config.challengeSuspicionThreshold) {
    return { verdict: { verdict: 'challenge' }, patternStreak, intervalMs, suspicionDelta };
  }
  if (patternViolated || speedViolated) {
    const reason = patternViolated ? 'pattern' : 'speed';
    return { verdict: { verdict: 'reject', reason }, patternStreak, intervalMs, suspicionDelta };
  }

  return { verdict: { verdict: 'ok' }, patternStreak, intervalMs, suspicionDelta };
}
