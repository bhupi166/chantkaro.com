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

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  /** Set via `wrangler secret put ADMIN_TOKEN` — never in source control or the frontend. */
  ADMIN_TOKEN?: string;
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'",
};

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
    const config = await getSyncConfig(env);
    return jsonResponse(
      {
        mode: config.mode,
        batchThreshold: config.batchThreshold,
        totalsRefreshSeconds: config.totalsRefreshSeconds,
        submissionsPaused: config.submissionsPaused,
        updatedAt: config.updatedAt,
      },
      { status: 200 },
      cors,
    );
  });
}

async function handleIncrement(request: Request, env: Env, cors: Headers): Promise<Response> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Request body too large.' }, { status: 413 }, cors);
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

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const withinLimit = await checkAndIncrementRateLimit(env, ip);
  if (!withinLimit) {
    return jsonResponse({ error: 'Too many requests. Please slow down.' }, { status: 429 }, cors);
  }

  const { category, amount, idempotencyKey } = validation.value;

  const existing = await env.DB.prepare(
    'SELECT idempotency_key FROM idempotency_keys WHERE idempotency_key = ?1',
  )
    .bind(idempotencyKey)
    .first();
  if (existing) {
    return jsonResponse({ error: 'This batch was already applied.' }, { status: 409 }, cors);
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
  const snapshot = await getUsageSnapshot(env);
  return jsonResponse(snapshot, { status: 200 }, cors, { 'Cache-Control': 'no-store' });
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

    return jsonResponse({ error: 'Not found.' }, { status: 404 }, cors);
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await pruneExpiredRateLimits(env);
    const deletedIdempotencyRows = await pruneExpiredIdempotencyKeys(env);
    if (deletedIdempotencyRows > 0) {
      console.log(`Pruned ${deletedIdempotencyRows} expired idempotency record(s).`);
    }

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
