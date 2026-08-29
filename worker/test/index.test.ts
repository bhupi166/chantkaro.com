import { beforeEach, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { createFakeD1 } from './fakeD1';
import { resetFakeEdgeCache } from './setup';
import type { Env } from '../src/index';

const ADMIN_TOKEN = 'test-admin-token';

interface TotalsBody {
  chantsAndPrayers: number;
  positiveAffirmations: number;
}

function makeEnv() {
  const fakeEnv = {
    DB: createFakeD1(),
    ALLOWED_ORIGINS: 'https://chantkaro.com',
    ADMIN_TOKEN,
  };
  return fakeEnv as unknown as Env & { DB: ReturnType<typeof createFakeD1> };
}

function incrementRequest(body: unknown) {
  return new Request('https://api.chantkaro.com/api/increment', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://chantkaro.com',
      'CF-Connecting-IP': '203.0.113.9',
    },
    body: JSON.stringify(body),
  });
}

function adminRequest(path: string, token = ADMIN_TOKEN, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return new Request(`https://api.chantkaro.com${path}`, { ...init, headers });
}

describe('Worker fetch handler', () => {
  let env: ReturnType<typeof makeEnv>;

  beforeEach(() => {
    env = makeEnv();
    resetFakeEdgeCache();
  });

  it('GET /api/totals starts at zero for both categories', async () => {
    const res = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ chantsAndPrayers: 0, positiveAffirmations: 0 });
  });

  it('POST /api/increment applies a valid batch and updates totals', async () => {
    const res = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 7, idempotencyKey: 'batch-key-0000001' }),
      env,
    );
    expect(res.status).toBe(200);

    const totalsRes = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
    const totals = (await totalsRes.json()) as TotalsBody;
    expect(totals.chantsAndPrayers).toBe(7);
  });

  it('rejects a resubmitted idempotency key with 409 and does not double-apply it', async () => {
    const payload = { category: 'affirmation', amount: 5, idempotencyKey: 'batch-key-0000002' };
    const first = await worker.fetch(incrementRequest(payload), env);
    expect(first.status).toBe(200);

    const second = await worker.fetch(incrementRequest(payload), env);
    expect(second.status).toBe(409);

    const totalsRes = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
    const totals = (await totalsRes.json()) as TotalsBody;
    expect(totals.positiveAffirmations).toBe(5); // not 10
  });

  it('rejects an invalid category with 400 and does not touch totals', async () => {
    const res = await worker.fetch(
      incrementRequest({ category: 'devotion-points', amount: 3, idempotencyKey: 'batch-key-0000003' }),
      env,
    );
    expect(res.status).toBe(400);

    const totalsRes = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
    const totals = (await totalsRes.json()) as TotalsBody;
    expect(totals.chantsAndPrayers + totals.positiveAffirmations).toBe(0);
  });

  it('rejects a non-positive amount with 400', async () => {
    const res = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 0, idempotencyKey: 'batch-key-0000004' }),
      env,
    );
    expect(res.status).toBe(400);
  });

  it('accepts a cost-protection-sized batch (1000) but rejects one far beyond any mode (5000)', async () => {
    const ok = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 1000, idempotencyKey: 'batch-key-0000005' }),
      env,
    );
    expect(ok.status).toBe(200);

    const tooBig = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 5000, idempotencyKey: 'batch-key-0000006' }),
      env,
    );
    expect(tooBig.status).toBe(400);
  });

  it('omits Access-Control-Allow-Origin for a disallowed origin', async () => {
    const res = await worker.fetch(
      new Request('https://api.chantkaro.com/api/totals', { headers: { origin: 'https://evil.example' } }),
      env,
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await worker.fetch(new Request('https://api.chantkaro.com/api/nope'), env);
    expect(res.status).toBe(404);
  });

  it('GET /api/health reports ok', async () => {
    const res = await worker.fetch(new Request('https://api.chantkaro.com/api/health'), env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  describe('GET /api/config', () => {
    it('returns the default adaptive config', async () => {
      const res = await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        mode: 'normal',
        batchThreshold: 100,
        totalsRefreshSeconds: 45,
        submissionsPaused: false,
      });
    });

    it('is cacheable — a second read within the TTL does not re-run the query', async () => {
      const req = () => new Request('https://api.chantkaro.com/api/config');
      const first = await worker.fetch(req(), env);
      expect(first.headers.get('Cache-Control')).toMatch(/max-age=/);

      // Change the underlying config directly (bypassing the endpoint) —
      // a genuinely cached response won't reflect this until invalidated.
      env.DB.setSyncConfigRaw({ mode: 'high', batch_threshold: 500 });
      const second = await worker.fetch(req(), env);
      const body = (await second.json()) as { mode: string };
      expect(body.mode).toBe('normal'); // served from cache, not re-queried
    });
  });

  describe('GET /api/totals caching', () => {
    it('serves a cached response, so an increment is not immediately visible within the TTL', async () => {
      const totalsReq = () => new Request('https://api.chantkaro.com/api/totals');
      const before = (await (await worker.fetch(totalsReq(), env)).json()) as TotalsBody;
      expect(before.chantsAndPrayers).toBe(0);

      await worker.fetch(
        incrementRequest({ category: 'chant', amount: 42, idempotencyKey: 'cache-test-key-01' }),
        env,
      );

      const after = (await (await worker.fetch(totalsReq(), env)).json()) as TotalsBody;
      expect(after.chantsAndPrayers).toBe(0); // still cached — "near real-time", not instant
    });
  });

  describe('Admin endpoints', () => {
    it('GET /api/admin/usage requires a valid admin token', async () => {
      const unauthenticated = await worker.fetch(
        new Request('https://api.chantkaro.com/api/admin/usage'),
        env,
      );
      expect(unauthenticated.status).toBe(401);

      const wrongToken = await worker.fetch(adminRequest('/api/admin/usage', 'wrong-token'), env);
      expect(wrongToken.status).toBe(401);

      const authorized = await worker.fetch(adminRequest('/api/admin/usage'), env);
      expect(authorized.status).toBe(200);
      const body = await authorized.json();
      expect(body).toHaveProperty('idempotencyKeyRows');
      expect(body).toHaveProperty('config');
      expect(body).toHaveProperty('estimatedStorage');
      // No personal data of any kind belongs in this response.
      expect(JSON.stringify(body)).not.toMatch(/name|email|phone|profile/i);
    });

    it('PATCH /api/admin/config requires a valid admin token', async () => {
      const res = await worker.fetch(
        adminRequest('/api/admin/config', 'wrong-token', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mode: 'high' }),
        }),
        env,
      );
      expect(res.status).toBe(401);
    });

    it('PATCH /api/admin/config updates the runtime threshold without any redeploy', async () => {
      const res = await worker.fetch(
        adminRequest('/api/admin/config', ADMIN_TOKEN, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mode: 'high', batchThreshold: 500, totalsRefreshSeconds: 200 }),
        }),
        env,
      );
      expect(res.status).toBe(200);

      const configRes = await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env);
      const body = await configRes.json();
      expect(body).toMatchObject({ mode: 'high', batchThreshold: 500, totalsRefreshSeconds: 200 });
    });

    it('PATCH /api/admin/config can pause submissions and later resume them', async () => {
      await worker.fetch(
        adminRequest('/api/admin/config', ADMIN_TOKEN, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ submissionsPaused: true }),
        }),
        env,
      );
      const paused = await (
        await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env)
      ).json();
      expect(paused).toMatchObject({ submissionsPaused: true });

      await worker.fetch(
        adminRequest('/api/admin/config', ADMIN_TOKEN, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ submissionsPaused: false }),
        }),
        env,
      );
      const resumed = await (
        await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env)
      ).json();
      expect(resumed).toMatchObject({ submissionsPaused: false });
    });

    it('rejects an out-of-range batchThreshold', async () => {
      const res = await worker.fetch(
        adminRequest('/api/admin/config', ADMIN_TOKEN, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ batchThreshold: -5 }),
        }),
        env,
      );
      expect(res.status).toBe(400);
    });

    it('a config change invalidates the edge cache immediately', async () => {
      await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env); // warm the cache
      await worker.fetch(
        adminRequest('/api/admin/config', ADMIN_TOKEN, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mode: 'cost-protection', batchThreshold: 1000 }),
        }),
        env,
      );
      const body = await (
        await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env)
      ).json();
      expect(body).toMatchObject({ mode: 'cost-protection', batchThreshold: 1000 });
    });
  });
});
