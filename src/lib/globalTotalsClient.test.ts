import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CONFIG_RESPONSE = {
  mode: 'normal',
  batchThreshold: 100,
  totalsRefreshSeconds: 45,
  submissionsPaused: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** Routes GET /api/config to a canned config response; everything else goes to `handler`. */
function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/api/config')) {
      return new Response(JSON.stringify(CONFIG_RESPONSE), { status: 200 });
    }
    return handler(url, init);
  });
}

function incrementCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter((call) => (call[0] as string).includes('/api/increment'));
}

function deleteQueueDatabase(): Promise<void> {
  // fake-indexeddb's global `indexedDB` persists across tests within a
  // file even though vi.resetModules() clears the JS module registry —
  // it simulates a real, durable browser database, not per-test state.
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('chantkaro-queue');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function freshClient() {
  vi.resetModules();
  window.localStorage.clear();
  await deleteQueueDatabase();
  const [{ globalTotalsClient }, syncConfigModule] = await Promise.all([
    import('./globalTotalsClient'),
    import('./syncConfigClient'),
  ]);
  syncConfigModule.__resetSyncConfigCacheForTests();
  await globalTotalsClient.whenReady();
  return { globalTotalsClient, syncConfigModule };
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
    const fetchMock = mockFetch(async (_url, init) => {
      expect(Object.keys(JSON.parse(init?.body as string)).sort()).toEqual([
        'amount',
        'category',
        'idempotencyKey',
      ]);
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();

    expect(incrementCalls(fetchMock)).toHaveLength(1);
  });

  it('does not record anything when contribution is disabled', async () => {
    const { globalTotalsClient } = await freshClient();
    globalTotalsClient.record('chant', false);
    expect(globalTotalsClient.getState().pending.chant).toBe(0);
  });

  it('one repetition does not generate one server request', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    await globalTotalsClient.sync(); // nothing queued yet — below threshold
    expect(incrementCalls(fetchMock)).toHaveLength(0);
  });

  it('a batch of 100 repetitions (the default threshold) generates exactly one increment request', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    for (let i = 0; i < 100; i++) globalTotalsClient.record('chant', true);
    await globalTotalsClient.sync();

    expect(incrementCalls(fetchMock)).toHaveLength(1);
    const body = JSON.parse(incrementCalls(fetchMock)[0][1].body as string);
    expect(body.amount).toBe(100);
  });

  it('99 repetitions do not yet cross the default threshold', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    for (let i = 0; i < 99; i++) globalTotalsClient.record('chant', true);
    await globalTotalsClient.sync();
    expect(incrementCalls(fetchMock)).toHaveLength(0);
    expect(globalTotalsClient.getState().pending.chant).toBe(99);
  });

  it('changing the server-configured threshold changes client batching without any redeploy', async () => {
    const { globalTotalsClient, syncConfigModule } = await freshClient();
    // Simulate an administrator lowering the threshold via PATCH
    // /api/admin/config — the client just re-fetches /api/config.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/config')) {
          return new Response(JSON.stringify({ ...CONFIG_RESPONSE, batchThreshold: 10 }), {
            status: 200,
          });
        }
        return new Response(null, { status: 200 });
      }),
    );
    await syncConfigModule.getSyncConfig(true);

    for (let i = 0; i < 10; i++) globalTotalsClient.record('chant', true);
    await globalTotalsClient.sync();
    expect(incrementCalls(globalThis.fetch as ReturnType<typeof vi.fn>)).toHaveLength(1);
  });

  it('cost-protection mode (threshold 1000) reduces request frequency vs. normal mode', async () => {
    const { globalTotalsClient, syncConfigModule } = await freshClient();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/config')) {
          return new Response(JSON.stringify({ ...CONFIG_RESPONSE, batchThreshold: 1000 }), {
            status: 200,
          });
        }
        return new Response(null, { status: 200 });
      }),
    );
    await syncConfigModule.getSyncConfig(true);

    for (let i = 0; i < 999; i++) globalTotalsClient.record('chant', true);
    await globalTotalsClient.sync();
    expect(incrementCalls(globalThis.fetch as ReturnType<typeof vi.fn>)).toHaveLength(0);
  });

  it('syncs a queued batch exactly once and does not resend after success', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();
    await globalTotalsClient.sync();

    expect(incrementCalls(fetchMock)).toHaveLength(1);
    expect(globalTotalsClient.getState().queue).toHaveLength(0);
  });

  it('keeps a batch queued when offline and syncs it once connectivity returns', async () => {
    const { globalTotalsClient } = await freshClient();
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const fetchMock = mockFetch(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();
    expect(incrementCalls(fetchMock)).toHaveLength(0);
    expect(globalTotalsClient.getState().queue).toHaveLength(1);

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await globalTotalsClient.sync();
    expect(incrementCalls(fetchMock)).toHaveLength(1);
    expect(globalTotalsClient.getState().queue).toHaveLength(0);
  });

  it('treats a 409 (already-applied idempotency key) as a safe drop, not a resend loop', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async () => new Response(null, { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('affirmation', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();

    expect(globalTotalsClient.getState().queue).toHaveLength(0);
  });

  it('failed batches remain queued locally and are not lost', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async () => {
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();

    expect(globalTotalsClient.getState().queue).toHaveLength(1);
    expect(globalTotalsClient.getState().consecutiveFailures).toBe(1);
  });

  it('applies controlled backoff and does not retry aggressively after a failure', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async () => {
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', fetchMock);

    globalTotalsClient.record('chant', true);
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync(); // fails, schedules backoff
    await globalTotalsClient.sync(); // immediately again — should be a no-op due to backoff

    expect(incrementCalls(fetchMock)).toHaveLength(1); // only the first attempt actually fired
  });

  it('does not send new batches while the server has paused submissions, but keeps accumulating locally', async () => {
    const { globalTotalsClient, syncConfigModule } = await freshClient();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/config')) {
          return new Response(JSON.stringify({ ...CONFIG_RESPONSE, submissionsPaused: true }), {
            status: 200,
          });
        }
        return new Response(null, { status: 200 });
      }),
    );
    await syncConfigModule.getSyncConfig(true);

    globalTotalsClient.record('chant', true); // personal/local accumulation still happens
    globalTotalsClient.flushPendingNow();
    await globalTotalsClient.sync();

    expect(incrementCalls(globalThis.fetch as ReturnType<typeof vi.fn>)).toHaveLength(0);
    expect(globalTotalsClient.getState().queue).toHaveLength(1); // preserved, not discarded
  });
});
