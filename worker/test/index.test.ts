import { beforeEach, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { createFakeD1 } from './fakeD1';
import type { Env } from '../src/index';

function makeEnv() {
  const fakeEnv = {
    DB: createFakeD1(),
    ALLOWED_ORIGINS: 'https://chantkaro.com',
  };
  return fakeEnv as unknown as Env & { DB: ReturnType<typeof createFakeD1> };
}

interface TotalsBody {
  chantsAndPrayers: number;
  positiveAffirmations: number;
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

describe('Worker fetch handler', () => {
  let env: ReturnType<typeof makeEnv>;

  beforeEach(() => {
    env = makeEnv();
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
      incrementRequest({
        category: 'devotion-points',
        amount: 3,
        idempotencyKey: 'batch-key-0000003',
      }),
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

  it('omits Access-Control-Allow-Origin for a disallowed origin', async () => {
    const res = await worker.fetch(
      new Request('https://api.chantkaro.com/api/totals', {
        headers: { origin: 'https://evil.example' },
      }),
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
});
