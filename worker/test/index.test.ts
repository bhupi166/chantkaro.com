import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';
import { createFakeD1 } from './fakeD1';
import { resetFakeEdgeCache } from './setup';
import { verifySession } from '../src/session';
import type { Env } from '../src/index';

const ADMIN_TOKEN = 'test-admin-token';
const SESSION_SIGNING_KEY = 'test-session-signing-key';
const TURNSTILE_SECRET_KEY = 'test-turnstile-secret-key';

interface TotalsBody {
  chantsAndPrayers: number;
  positiveAffirmations: number;
}

function makeEnv() {
  const fakeEnv = {
    DB: createFakeD1(),
    ALLOWED_ORIGINS: 'https://chantkaro.com',
    ADMIN_TOKEN,
    SESSION_SIGNING_KEY,
    TURNSTILE_SECRET_KEY,
    TURNSTILE_SITE_KEY: 'test-site-key',
  };
  return fakeEnv as unknown as Env & { DB: ReturnType<typeof createFakeD1> };
}

let deviceCounter = 0;
function freshDeviceId(): string {
  deviceCounter += 1;
  return `device-id-${deviceCounter}-${'x'.repeat(10)}`;
}

async function startSession(
  env: ReturnType<typeof makeEnv>,
  deviceId = freshDeviceId(),
  ip = '203.0.113.9',
): Promise<{ token: string; deviceId: string }> {
  const res = await worker.fetch(
    new Request('https://api.chantkaro.com/api/session/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://chantkaro.com', 'CF-Connecting-IP': ip },
      body: JSON.stringify({ deviceId }),
    }),
    env,
  );
  const body = (await res.json()) as { token: string };
  return { token: body.token, deviceId };
}

/** A generous default elapsedMs so amount-based speed checks never trip unless a test wants them to. */
function incrementRequest(
  body: Record<string, unknown>,
  token: string,
  ip = '203.0.113.9',
) {
  return new Request('https://api.chantkaro.com/api/increment', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://chantkaro.com',
      'CF-Connecting-IP': ip,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ elapsedMs: 300_000, mode: 'tap', ...body }),
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

  describe('POST /api/session/start', () => {
    it('issues a session token given a valid deviceId', async () => {
      const res = await worker.fetch(
        new Request('https://api.chantkaro.com/api/session/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'https://chantkaro.com', 'CF-Connecting-IP': '203.0.113.9' },
          body: JSON.stringify({ deviceId: freshDeviceId() }),
        }),
        env,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { token: string; expiresAt: string; turnstileSiteKey: string };
      expect(typeof body.token).toBe('string');
      expect(body.token.split('.').length).toBe(2);
      expect(body.turnstileSiteKey).toBe('test-site-key');
    });

    it('rejects a malformed deviceId', async () => {
      const res = await worker.fetch(
        new Request('https://api.chantkaro.com/api/session/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'https://chantkaro.com', 'CF-Connecting-IP': '203.0.113.9' },
          body: JSON.stringify({ deviceId: 'x' }),
        }),
        env,
      );
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/increment — session requirement', () => {
    it('rejects a batch with no session token', async () => {
      const res = await worker.fetch(
        new Request('https://api.chantkaro.com/api/increment', {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'https://chantkaro.com', 'CF-Connecting-IP': '203.0.113.9' },
          body: JSON.stringify({ category: 'chant', amount: 7, idempotencyKey: 'batch-key-notoken1', elapsedMs: 1000, mode: 'tap' }),
        }),
        env,
      );
      expect(res.status).toBe(401);
    });

    it('rejects a batch with a garbage/forged token', async () => {
      const res = await worker.fetch(
        incrementRequest({ category: 'chant', amount: 7, idempotencyKey: 'batch-key-forged1' }, 'not-a-real-token'),
        env,
      );
      expect(res.status).toBe(401);
    });
  });

  it('POST /api/increment applies a valid batch and updates totals', async () => {
    const { token } = await startSession(env);
    const res = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 7, idempotencyKey: 'batch-key-0000001' }, token),
      env,
    );
    expect(res.status).toBe(200);

    const totalsRes = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
    const totals = (await totalsRes.json()) as TotalsBody;
    expect(totals.chantsAndPrayers).toBe(7);
  });

  it('rejects a resubmitted idempotency key with 409 and does not double-apply it', async () => {
    const { token } = await startSession(env);
    const payload = { category: 'affirmation', amount: 5, idempotencyKey: 'batch-key-0000002' };
    const first = await worker.fetch(incrementRequest(payload, token), env);
    expect(first.status).toBe(200);

    const second = await worker.fetch(incrementRequest(payload, token), env);
    expect(second.status).toBe(409);

    const totalsRes = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
    const totals = (await totalsRes.json()) as TotalsBody;
    expect(totals.positiveAffirmations).toBe(5); // not 10
  });

  it('rejects an invalid category with 400 and does not touch totals', async () => {
    const { token } = await startSession(env);
    const res = await worker.fetch(
      incrementRequest({ category: 'devotion-points', amount: 3, idempotencyKey: 'batch-key-0000003' }, token),
      env,
    );
    expect(res.status).toBe(400);

    const totalsRes = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
    const totals = (await totalsRes.json()) as TotalsBody;
    expect(totals.chantsAndPrayers + totals.positiveAffirmations).toBe(0);
  });

  it('rejects a non-positive amount with 400', async () => {
    const { token } = await startSession(env);
    const res = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 0, idempotencyKey: 'batch-key-0000004' }, token),
      env,
    );
    expect(res.status).toBe(400);
  });

  it('accepts a cost-protection-sized batch (1000) but rejects one far beyond any mode (5000)', async () => {
    const { token } = await startSession(env);
    const ok = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 1000, idempotencyKey: 'batch-key-0000005' }, token),
      env,
    );
    expect(ok.status).toBe(200);

    const tooBig = await worker.fetch(
      incrementRequest({ category: 'chant', amount: 5000, idempotencyKey: 'batch-key-0000006' }, token),
      env,
    );
    expect(tooBig.status).toBe(400);
  });

  describe('speed and pattern protection', () => {
    it('rejects a batch whose amount/elapsedMs implies an impossible tap rate', async () => {
      const { token } = await startSession(env);
      const res = await worker.fetch(
        incrementRequest(
          { category: 'chant', amount: 500, idempotencyKey: 'batch-key-speed1', elapsedMs: 1000 }, // 500/sec
          token,
        ),
        env,
      );
      expect(res.status).toBe(422);

      const totalsRes = await worker.fetch(new Request('https://api.chantkaro.com/api/totals'), env);
      const totals = (await totalsRes.json()) as TotalsBody;
      expect(totals.chantsAndPrayers).toBe(0); // never applied
    });

    it('does not apply the speed check to very small batches', async () => {
      const { token } = await startSession(env);
      const res = await worker.fetch(
        incrementRequest(
          { category: 'chant', amount: 2, idempotencyKey: 'batch-key-small1', elapsedMs: 1 },
          token,
        ),
        env,
      );
      expect(res.status).toBe(200);
    });

    it('flags repeated near-identical batch intervals and eventually requires a challenge', async () => {
      const { token } = await startSession(env);
      let lastStatus = 0;
      for (let i = 0; i < 5; i++) {
        const res = await worker.fetch(
          incrementRequest(
            { category: 'chant', amount: 2, idempotencyKey: `batch-key-pattern-${i}`, elapsedMs: 60_000 },
            token,
          ),
          env,
        );
        lastStatus = res.status;
        if (lastStatus !== 200) break;
      }
      // Identical elapsedMs every call drives the same interval repeatedly —
      // this must eventually stop being silently accepted.
      expect(lastStatus).not.toBe(200);
    });
  });

  describe('progressive challenge (Turnstile)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('issues a challenge once suspicion crosses the threshold, and resumes after it is solved', async () => {
      const { token } = await startSession(env);

      // Drive suspicion up via repeated identical-interval batches.
      let challengeStatus: Response | null = null;
      for (let i = 0; i < 6; i++) {
        const res = await worker.fetch(
          incrementRequest(
            { category: 'chant', amount: 2, idempotencyKey: `batch-key-challenge-${i}`, elapsedMs: 45_000 },
            token,
          ),
          env,
        );
        if (res.status === 428) {
          challengeStatus = res;
          break;
        }
      }
      expect(challengeStatus).not.toBeNull();
      const challengeBody = (await challengeStatus!.json()) as { challengeRequired: boolean; turnstileSiteKey: string };
      expect(challengeBody.challengeRequired).toBe(true);
      expect(challengeBody.turnstileSiteKey).toBe('test-site-key');

      // Solve it: mock Turnstile's siteverify to succeed.
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 })),
      );
      const solved = await worker.fetch(
        incrementRequest(
          {
            category: 'chant',
            amount: 2,
            idempotencyKey: 'batch-key-challenge-solved',
            elapsedMs: 45_000,
            turnstileToken: 'a-valid-looking-turnstile-token',
          },
          token,
        ),
        env,
      );
      expect(solved.status).toBe(200);
    });

    it('rejects a batch when the Turnstile token fails verification', async () => {
      const { token } = await startSession(env);
      const payload = await verifySession(env, token);
      env.DB.setSessionRaw(payload!.sid, { challenge_required: 1 });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 })),
      );
      const res = await worker.fetch(
        incrementRequest(
          {
            category: 'chant',
            amount: 2,
            idempotencyKey: 'batch-key-challenge-fail',
            turnstileToken: 'a-turnstile-token-that-fails',
          },
          token,
        ),
        env,
      );
      expect(res.status).toBe(403);
    });
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
    it('returns the default adaptive config plus a public Turnstile site key', async () => {
      const res = await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        mode: 'normal',
        batchThreshold: 100,
        totalsRefreshSeconds: 45,
        submissionsPaused: false,
        turnstileSiteKey: 'test-site-key',
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

    it('reflects the admin abuse-lockdown kill switch as submissionsPaused', async () => {
      env.DB.setSecurityConfigRaw({ abuse_lockdown: 1 });
      const res = await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env);
      const body = (await res.json()) as { submissionsPaused: boolean };
      expect(body.submissionsPaused).toBe(true);
    });
  });

  describe('GET /api/totals caching', () => {
    it('serves a cached response, so an increment is not immediately visible within the TTL', async () => {
      const { token } = await startSession(env);
      const totalsReq = () => new Request('https://api.chantkaro.com/api/totals');
      const before = (await (await worker.fetch(totalsReq(), env)).json()) as TotalsBody;
      expect(before.chantsAndPrayers).toBe(0);

      await worker.fetch(
        incrementRequest({ category: 'chant', amount: 42, idempotencyKey: 'cache-test-key-01' }, token),
        env,
      );

      const after = (await (await worker.fetch(totalsReq(), env)).json()) as TotalsBody;
      expect(after.chantsAndPrayers).toBe(0); // still cached — "near real-time", not instant
    });
  });

  describe('Admin endpoints', () => {
    it('GET /api/admin/usage requires a valid admin token and includes abuse metrics', async () => {
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
      expect(body).toHaveProperty('abuse');
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

    describe('security config (kill switch + thresholds)', () => {
      it('GET /api/admin/security-config requires a valid admin token', async () => {
        const res = await worker.fetch(adminRequest('/api/admin/security-config', 'wrong-token'), env);
        expect(res.status).toBe(401);
      });

      it('PATCH /api/admin/security-config can flip the abuse-lockdown kill switch', async () => {
        const res = await worker.fetch(
          adminRequest('/api/admin/security-config', ADMIN_TOKEN, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ abuseLockdown: true }),
          }),
          env,
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({ abuseLockdown: true });

        const publicConfig = (await (
          await worker.fetch(new Request('https://api.chantkaro.com/api/config'), env)
        ).json()) as { submissionsPaused: boolean };
        expect(publicConfig.submissionsPaused).toBe(true);
      });

      it('rejects an out-of-range maxTapRatePerSecond', async () => {
        const res = await worker.fetch(
          adminRequest('/api/admin/security-config', ADMIN_TOKEN, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ maxTapRatePerSecond: 1000 }),
          }),
          env,
        );
        expect(res.status).toBe(400);
      });
    });
  });
});
