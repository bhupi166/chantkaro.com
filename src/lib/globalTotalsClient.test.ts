import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function freshClient() {
  vi.resetModules();
  window.localStorage.clear();
  const mod = await import('./globalTotalsClient');
  return mod;
}

describe('globalTotalsClient', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('never includes custom text in the outgoing request body', async () => {
    const { globalTotalsClient } = await freshClient();
    const calls: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        calls.push(init?.body ? JSON.parse(init.body as string) : null);
        return new Response(null, { status: 200 });
      }),
    );

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();

    expect(calls).toHaveLength(1);
    const body = calls[0] as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['amount', 'category', 'idempotencyKey']);
    expect(body.category).toBe('chant');
    expect(body.amount).toBe(1);
  });

  it('does not record anything when contribution is disabled', async () => {
    const { globalTotalsClient } = await freshClient();
    globalTotalsClient.record('chant', false);
    expect(globalTotalsClient.getState().pending.chant).toBe(0);
  });

  it('syncs a queued batch exactly once and does not resend after success', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();
    await globalTotalsClient.sync();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(globalTotalsClient.getState().queue).toHaveLength(0);
  });

  it('keeps a batch queued when offline and syncs it once connectivity returns', async () => {
    const { globalTotalsClient } = await freshClient();
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(globalTotalsClient.getState().queue).toHaveLength(1);

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await globalTotalsClient.sync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(globalTotalsClient.getState().queue).toHaveLength(0);
  });

  it('treats a 409 (already-applied idempotency key) as a safe drop, not a resend loop', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = vi.fn(async () => new Response(null, { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('affirmation', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();

    expect(globalTotalsClient.getState().queue).toHaveLength(0);
  });
});

describe('fetchGlobalTotals', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('computes the combined total as chants + affirmations', async () => {
    const { fetchGlobalTotals } = await freshClient();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ chantsAndPrayers: 125450, positiveAffirmations: 86320 }), {
            status: 200,
          }),
      ),
    );

    const totals = await fetchGlobalTotals();
    expect(totals?.chantsAndPrayers).toBe(125450);
    expect(totals?.positiveAffirmations).toBe(86320);
    expect(totals?.totalPositiveRepetitions).toBe(211770);
  });

  it('returns null when the API is unavailable, instead of throwing', async () => {
    const { fetchGlobalTotals } = await freshClient();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    const totals = await fetchGlobalTotals();
    expect(totals).toBeNull();
  });
});
