import { buildCorsHeaders, parseAllowedOrigins } from './cors';
import { checkAndIncrementRateLimit, pruneExpiredRateLimits } from './rateLimit';
import { MAX_BODY_BYTES, validateIncrementPayload } from './validate';

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'",
};

function jsonResponse(body: unknown, init: ResponseInit, cors: Headers): Response {
  const headers = new Headers(cors);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  return new Response(JSON.stringify(body), { ...init, headers });
}

async function handleTotals(env: Env, cors: Headers): Promise<Response> {
  const rows = await env.DB.prepare('SELECT category, count FROM totals').all<{
    category: string;
    count: number;
  }>();
  let chantsAndPrayers = 0;
  let positiveAffirmations = 0;
  for (const row of rows.results ?? []) {
    if (row.category === 'chant') chantsAndPrayers = row.count;
    if (row.category === 'affirmation') positiveAffirmations = row.count;
  }
  return jsonResponse(
    { chantsAndPrayers, positiveAffirmations, updatedAt: new Date().toISOString() },
    { status: 200 },
    cors,
  );
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
  // half-applied batch.
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO idempotency_keys (idempotency_key, category, amount) VALUES (?1, ?2, ?3)',
    ).bind(idempotencyKey, category, amount),
    env.DB.prepare('UPDATE totals SET count = count + ?1 WHERE category = ?2').bind(
      amount,
      category,
    ),
  ]);

  return jsonResponse({ ok: true }, { status: 200 }, cors);
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
        return await handleTotals(env, cors);
      } catch {
        return jsonResponse(
          { error: 'Totals are temporarily unavailable.' },
          { status: 503 },
          cors,
        );
      }
    }

    if (url.pathname === '/api/increment' && request.method === 'POST') {
      try {
        return await handleIncrement(request, env, cors);
      } catch {
        return jsonResponse({ error: 'Could not process increment.' }, { status: 500 }, cors);
      }
    }

    return jsonResponse({ error: 'Not found.' }, { status: 404 }, cors);
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await pruneExpiredRateLimits(env);
  },
};
