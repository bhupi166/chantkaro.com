import { buildCorsHeaders, parseAllowedOrigins } from './cors';
import { checkAndIncrementRateLimit, pruneExpiredRateLimits } from './rateLimit';
import { MAX_BODY_BYTES, validateIncrementPayload } from './validate';
import { isAuthorizedAdmin } from './adminAuth';
import {
  checkStorageThresholds,
  getSyncConfig,
  getUsageSnapshot,
  pruneExpiredIdempotencyKeys,
  startOfCurrentMonthIso,
  countBatchesSince,
  updateSyncConfig,
  type SyncConfigPatch,
} from './db';
import { isSyncMode, nextAutoMode, MODE_PROFILES } from './syncConfig';
import { extractBearerToken, signSession, verifySession } from './session';
import {
  createSession,
  evaluateBatch,
  getAbuseMetrics,
  getSecurityConfig,
  getSession,
  hashSubject,
  incrementAbuseMetric,
  pruneExpiredSessions,
  resolveChallenge,
  updateSecurityConfig,
  updateSessionTracking,
  type SecurityConfigPatch,
} from './security';
import { verifyTurnstileToken } from './turnstile';

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  /** Public by design — Turnstile site keys are meant to be embedded in frontend code. */
  TURNSTILE_SITE_KEY?: string;
  /** Set via `wrangler secret put ADMIN_TOKEN` — never in source control or the frontend. */
  ADMIN_TOKEN?: string;
  /** Set via `wrangler secret put SESSION_SIGNING_KEY` — never in source control or the frontend. */
  SESSION_SIGNING_KEY?: string;
  /** Set via `wrangler secret put TURNSTILE_SECRET_KEY` — never in source control or the frontend. */
  TURNSTILE_SECRET_KEY?: string;
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'",
};

const DEVICE_ID_PATTERN = /^[A-Za-z0-9-]{8,100}$/;
/** Per-scope request ceilings for POST /api/increment — tighter than the shared per-IP limit. */
const SESSION_RATE_LIMIT_MAX = 30;
const DEVICE_RATE_LIMIT_MAX = 40;
const SESSION_START_RATE_LIMIT_MAX = 10;

function jsonResponse(
  body: unknown,
  init: ResponseInit,
  cors: Headers,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers(cors);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  if (extraHeaders) for (const [k, v] of Object.entries(extraHeaders)) headers.set(k, v);
  return new Response(JSON.stringify(body), { ...init, headers });
}

/**
 * Serves GET responses from Cloudflare's edge cache when possible, so
 * repeat visitors within the TTL window never reach D1 at all (this only
 * saves D1 reads/CPU — it does not reduce the Workers request count, which
 * needs a zone-level Cache Rule on these paths; see README "Cost model").
 */
async function withEdgeCache(
  request: Request,
  maxAgeSeconds: number,
  compute: () => Promise<Response>,
): Promise<Response> {
  const cache = caches.default;
  if (request.method === 'GET') {
    const cached = await cache.match(request);
    if (cached) return cached;
  }
  const response = await compute();
  if (request.method === 'GET' && response.status === 200) {
    const cacheable = new Response(response.body, response);
    cacheable.headers.set('Cache-Control', `public, max-age=${maxAgeSeconds}`);
    await cache.put(request, cacheable.clone());
    return cacheable;
  }
  return response;
}

async function handleTotals(request: Request, env: Env, cors: Headers): Promise<Response> {
  return withEdgeCache(request, 30, async () => {
    const [rows, config] = await Promise.all([
      env.DB.prepare('SELECT category, count FROM totals').all<{ category: string; count: number }>(),
      getSyncConfig(env),
    ]);
    let chantsAndPrayers = 0;
    let positiveAffirmations = 0;
    for (const row of rows.results ?? []) {
      if (row.category === 'chant') chantsAndPrayers = row.count;
      if (row.category === 'affirmation') positiveAffirmations = row.count;
    }
    return jsonResponse(
      {
        chantsAndPrayers,
        positiveAffirmations,
        updatedAt: new Date().toISOString(),
        // "Near real-time" — see spec: totals reflect the last edge-cache
        // refresh, not the instant of the tap. refreshHintSeconds tells the
        // client how often it's worth asking again.
        refreshHintSeconds: MODE_PROFILES[config.mode].totalsRefreshSeconds,
      },
      { status: 200 },
      cors,
    );
  });
}

async function handleConfig(request: Request, env: Env, cors: Headers): Promise<Response> {
  return withEdgeCache(request, 60, async () => {
    const [config, security] = await Promise.all([getSyncConfig(env), getSecurityConfig(env)]);
    return jsonResponse(
      {
        mode: config.mode,
        batchThreshold: config.batchThreshold,
        totalsRefreshSeconds: config.totalsRefreshSeconds,
        // Either a cost-driven pause or the administrator's abuse kill
        // switch is enough to stop new submissions — the client only needs
        // one boolean either way (see security.ts abuseLockdown).
        submissionsPaused: config.submissionsPaused || security.abuseLockdown,
        updatedAt: config.updatedAt,
        turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null,
      },
      { status: 200 },
      cors,
    );
  });
}

async function handleSessionStart(request: Request, env: Env, cors: Headers): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const withinLimit = await checkAndIncrementRateLimit(
    env,
    `session-start:${ip}`,
    SESSION_START_RATE_LIMIT_MAX,
  );
  if (!withinLimit) {
    return jsonResponse({ error: 'Too many requests. Please slow down.' }, { status: 429 }, cors);
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, { status: 400 }, cors);
  }
  const deviceId =
    parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>).deviceId : undefined;
  if (typeof deviceId !== 'string' || !DEVICE_ID_PATTERN.test(deviceId)) {
    return jsonResponse({ error: 'deviceId must be an 8-100 character id.' }, { status: 400 }, cors);
  }

  if (!env.SESSION_SIGNING_KEY) {
    return jsonResponse({ error: 'Session service temporarily unavailable.' }, { status: 503 }, cors);
  }

  const security = await getSecurityConfig(env);
  const [ipHash, deviceHash] = await Promise.all([hashSubject(ip), hashSubject(deviceId)]);
  const sessionId = crypto.randomUUID();
  const expiresAt = await createSession(env, sessionId, ipHash, deviceHash, security.sessionTtlSeconds);
  const iat = Math.floor(Date.now() / 1000);
  const token = await signSession(env, {
    sid: sessionId,
    iat,
    exp: iat + security.sessionTtlSeconds,
  });
  if (!token) {
    return jsonResponse({ error: 'Session service temporarily unavailable.' }, { status: 503 }, cors);
  }

  return jsonResponse(
    { token, expiresAt, turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null },
    { status: 200 },
    cors,
    { 'Cache-Control': 'no-store' },
  );
}

async function handleIncrement(request: Request, env: Env, cors: Headers): Promise<Response> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Request body too large.' }, { status: 413 }, cors);
  }

  // Never trust a repetition count with no server-issued session behind it.
  const token = extractBearerToken(request);
  if (!token) {
    return jsonResponse({ error: 'Session token required.' }, { status: 401 }, cors);
  }
  const payload = await verifySession(env, token);
  if (!payload) {
    return jsonResponse({ error: 'Invalid or expired session.' }, { status: 401 }, cors);
  }
  const session = await getSession(env, payload.sid);
  if (!session) {
    return jsonResponse({ error: 'Session not found or expired.' }, { status: 401 }, cors);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const [ipOk, sessionOk, deviceOk] = await Promise.all([
    checkAndIncrementRateLimit(env, ip),
    checkAndIncrementRateLimit(env, `session:${payload.sid}`, SESSION_RATE_LIMIT_MAX),
    checkAndIncrementRateLimit(env, `device:${session.deviceHash}`, DEVICE_RATE_LIMIT_MAX),
  ]);
  if (!ipOk || !sessionOk || !deviceOk) {
    return jsonResponse({ error: 'Too many requests. Please slow down.' }, { status: 429 }, cors);
  }

  const rawText = await request.text();
  if (rawText.length > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Request body too large.' }, { status: 413 }, cors);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, { status: 400 }, cors);
  }

  const validation = validateIncrementPayload(parsed);
  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, { status: 400 }, cors);
  }
  const { category, amount, idempotencyKey, elapsedMs, mode, turnstileToken } = validation.value;

  const existing = await env.DB.prepare(
    'SELECT idempotency_key FROM idempotency_keys WHERE idempotency_key = ?1',
  )
    .bind(idempotencyKey)
    .first();
  if (existing) {
    return jsonResponse({ error: 'This batch was already applied.' }, { status: 409 }, cors);
  }

  const security = await getSecurityConfig(env);
  const now = new Date();

  if (session.challengeRequired) {
    if (!turnstileToken) {
      return jsonResponse(
        { error: 'Verification required.', challengeRequired: true, turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null },
        { status: 428 },
        cors,
      );
    }
    const passed = await verifyTurnstileToken(env, turnstileToken, ip);
    if (!passed) {
      await incrementAbuseMetric(env, 'batches_rejected_auth');
      return jsonResponse({ error: 'Verification failed.' }, { status: 403 }, cors);
    }
    await incrementAbuseMetric(env, 'challenges_passed');
    await resolveChallenge(env, payload.sid);
    // A solved challenge is sufficient proof of legitimacy for this batch —
    // proceed straight to applying it below, without also re-running the
    // speed/pattern heuristics that flagged the session in the first place.
  } else {
    const evaluation = evaluateBatch({ mode, amount, elapsedMs, now, session, config: security });
    await updateSessionTracking(env, payload.sid, {
      suspicionScore: session.suspicionScore + evaluation.suspicionDelta,
      challengeRequired: evaluation.verdict.verdict === 'challenge',
      patternStreak: evaluation.patternStreak,
      lastBatchAtIso: now.toISOString(),
      lastIntervalMs: evaluation.intervalMs,
    });

    if (evaluation.verdict.verdict === 'reject') {
      await incrementAbuseMetric(
        env,
        evaluation.verdict.reason === 'speed' ? 'batches_rejected_speed' : 'batches_rejected_pattern',
      );
      // Rejected or quarantined: never applied to the global total. The
      // caller's own local/personal count is untouched by this response.
      return jsonResponse(
        { error: 'Batch rejected: implausible activity detected.' },
        { status: 422 },
        cors,
      );
    }
    if (evaluation.verdict.verdict === 'challenge') {
      await incrementAbuseMetric(env, 'challenges_issued');
      return jsonResponse(
        { error: 'Verification required.', challengeRequired: true, turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null },
        { status: 428 },
        cors,
      );
    }
  }

  // Record the idempotency key and bump the total atomically so a retried
  // request can never be double-applied, and a totals read never observes a
  // half-applied batch. (submissionsPaused is a client-side signal to stop
  // *sending* new batches — a batch that does arrive is still applied
  // normally rather than discarded; see db.ts / README "Cost model".)
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO idempotency_keys (idempotency_key, category, amount) VALUES (?1, ?2, ?3)',
    ).bind(idempotencyKey, category, amount),
    env.DB.prepare('UPDATE totals SET count = count + ?1 WHERE category = ?2').bind(amount, category),
  ]);

  return jsonResponse({ ok: true }, { status: 200 }, cors);
}

async function handleAdminUsage(request: Request, env: Env, cors: Headers): Promise<Response> {
  if (!isAuthorizedAdmin(request, env.ADMIN_TOKEN)) {
    return jsonResponse({ error: 'Unauthorized.' }, { status: 401 }, cors);
  }
  const [snapshot, abuse] = await Promise.all([getUsageSnapshot(env), getAbuseMetrics(env)]);
  return jsonResponse({ ...snapshot, abuse }, { status: 200 }, cors, { 'Cache-Control': 'no-store' });
}

async function handleAdminConfigPatch(request: Request, env: Env, cors: Headers): Promise<Response> {
  if (!isAuthorizedAdmin(request, env.ADMIN_TOKEN)) {
    return jsonResponse({ error: 'Unauthorized.' }, { status: 401 }, cors);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, { status: 400 }, cors);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'Request body must be a JSON object.' }, { status: 400 }, cors);
  }
  const raw = body as Record<string, unknown>;
  const patch: SyncConfigPatch = {};

  if ('mode' in raw) {
    if (!isSyncMode(raw.mode)) return jsonResponse({ error: 'Invalid mode.' }, { status: 400 }, cors);
    patch.mode = raw.mode;
  }
  if ('batchThreshold' in raw) {
    const n = raw.batchThreshold;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 100_000) {
      return jsonResponse({ error: 'batchThreshold must be an integer between 1 and 100000.' }, { status: 400 }, cors);
    }
    patch.batchThreshold = n;
  }
  if ('totalsRefreshSeconds' in raw) {
    const n = raw.totalsRefreshSeconds;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 10 || n > 3600) {
      return jsonResponse({ error: 'totalsRefreshSeconds must be an integer between 10 and 3600.' }, { status: 400 }, cors);
    }
    patch.totalsRefreshSeconds = n;
  }
  if ('submissionsPaused' in raw) {
    if (typeof raw.submissionsPaused !== 'boolean') {
      return jsonResponse({ error: 'submissionsPaused must be a boolean.' }, { status: 400 }, cors);
    }
    patch.submissionsPaused = raw.submissionsPaused;
  }
  if ('autoManaged' in raw) {
    if (typeof raw.autoManaged !== 'boolean') {
      return jsonResponse({ error: 'autoManaged must be a boolean.' }, { status: 400 }, cors);
    }
    patch.autoManaged = raw.autoManaged;
  }

  const updated = await updateSyncConfig(env, patch);
  // Manually-changed config invalidates the short-lived edge cache for
  // GET /api/config so the new values take effect immediately rather than
  // waiting out the old cache TTL.
  await caches.default.delete(new Request(new URL('/api/config', request.url)));
  return jsonResponse(updated, { status: 200 }, cors, { 'Cache-Control': 'no-store' });
}

async function handleAdminSecurityConfigGet(request: Request, env: Env, cors: Headers): Promise<Response> {
  if (!isAuthorizedAdmin(request, env.ADMIN_TOKEN)) {
    return jsonResponse({ error: 'Unauthorized.' }, { status: 401 }, cors);
  }
  const config = await getSecurityConfig(env);
  return jsonResponse(config, { status: 200 }, cors, { 'Cache-Control': 'no-store' });
}

async function handleAdminSecurityConfigPatch(request: Request, env: Env, cors: Headers): Promise<Response> {
  if (!isAuthorizedAdmin(request, env.ADMIN_TOKEN)) {
    return jsonResponse({ error: 'Unauthorized.' }, { status: 401 }, cors);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, { status: 400 }, cors);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'Request body must be a JSON object.' }, { status: 400 }, cors);
  }
  const raw = body as Record<string, unknown>;
  const patch: SecurityConfigPatch = {};

  const numberField = (key: keyof SecurityConfigPatch, min: number, max: number): string | null => {
    if (!(key in raw)) return null;
    const n = raw[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) {
      return `${key} must be a number between ${min} and ${max}.`;
    }
    (patch as Record<string, unknown>)[key] = n;
    return null;
  };

  for (const err of [
    numberField('maxTapRatePerSecond', 0.1, 100),
    numberField('maxVoiceRatePerSecond', 0.1, 100),
    numberField('sessionTtlSeconds', 300, 86_400),
    numberField('challengeSuspicionThreshold', 1, 100),
  ]) {
    if (err) return jsonResponse({ error: err }, { status: 400 }, cors);
  }
  if ('abuseLockdown' in raw) {
    if (typeof raw.abuseLockdown !== 'boolean') {
      return jsonResponse({ error: 'abuseLockdown must be a boolean.' }, { status: 400 }, cors);
    }
    patch.abuseLockdown = raw.abuseLockdown;
  }

  const updated = await updateSecurityConfig(env, patch);
  // abuseLockdown feeds into the public /api/config submissionsPaused flag.
  await caches.default.delete(new Request(new URL('/api/config', request.url)));
  return jsonResponse(updated, { status: 200 }, cors, { 'Cache-Control': 'no-store' });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const cors = buildCorsHeaders(request.headers.get('Origin'), allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return jsonResponse({ ok: true, time: new Date().toISOString() }, { status: 200 }, cors);
    }

    if (url.pathname === '/api/totals' && request.method === 'GET') {
      try {
        return await handleTotals(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Totals are temporarily unavailable.' }, { status: 503 }, cors);
      }
    }

    if (url.pathname === '/api/config' && request.method === 'GET') {
      try {
        return await handleConfig(request, env, cors);
      } catch {
        // A config-fetch failure must never block counting — the client
        // falls back to its own last-known/default threshold.
        return jsonResponse({ error: 'Config is temporarily unavailable.' }, { status: 503 }, cors);
      }
    }

    if (url.pathname === '/api/session/start' && request.method === 'POST') {
      try {
        return await handleSessionStart(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Could not start session.' }, { status: 500 }, cors);
      }
    }

    if (url.pathname === '/api/increment' && request.method === 'POST') {
      try {
        return await handleIncrement(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Could not process increment.' }, { status: 500 }, cors);
      }
    }

    if (url.pathname === '/api/admin/usage' && request.method === 'GET') {
      try {
        return await handleAdminUsage(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Could not load usage snapshot.' }, { status: 500 }, cors);
      }
    }

    if (url.pathname === '/api/admin/config' && request.method === 'PATCH') {
      try {
        return await handleAdminConfigPatch(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Could not update config.' }, { status: 500 }, cors);
      }
    }

    if (url.pathname === '/api/admin/security-config' && request.method === 'GET') {
      try {
        return await handleAdminSecurityConfigGet(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Could not load security config.' }, { status: 500 }, cors);
      }
    }

    if (url.pathname === '/api/admin/security-config' && request.method === 'PATCH') {
      try {
        return await handleAdminSecurityConfigPatch(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Could not update security config.' }, { status: 500 }, cors);
      }
    }

    return jsonResponse({ error: 'Not found.' }, { status: 404 }, cors);
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await pruneExpiredRateLimits(env);
    const deletedIdempotencyRows = await pruneExpiredIdempotencyKeys(env);
    if (deletedIdempotencyRows > 0) {
      console.log(`Pruned ${deletedIdempotencyRows} expired idempotency record(s).`);
    }
    await pruneExpiredSessions(env);

    await checkStorageThresholds(env);

    const config = await getSyncConfig(env);
    if (!config.autoManaged) return; // an administrator has taken manual control

    const monthlyBatches = await countBatchesSince(env, startOfCurrentMonthIso());
    const suggested = nextAutoMode(config.mode, monthlyBatches);
    if (suggested !== config.mode) {
      const profile = MODE_PROFILES[suggested];
      await updateSyncConfig(env, {
        mode: suggested,
        batchThreshold: profile.batchThreshold,
        totalsRefreshSeconds: profile.totalsRefreshSeconds,
      });
      // A mode escalation is significant enough to be worth one log line —
      // deliberately the only "routine" thing this Worker logs (see spec:
      // "Minimize production logging").
      console.log(`Auto-escalated sync mode to "${suggested}" (${monthlyBatches} batches this month).`);
    }
  },
};
