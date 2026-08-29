import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CONFIG_RESPONSE = {
  mode: 'normal',
  batchThreshold: 100,
  totalsRefreshSeconds: 45,
  submissionsPaused: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  turnstileSiteKey: 'test-site-key',
};

const SESSION_RESPONSE = {
  token: 'header.signature',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  turnstileSiteKey: 'test-site-key',
};

/**
 * Routes GET /api/config and POST /api/session/start to canned responses
 * (every sync() needs both before it can send a batch); everything else
 * goes to `handler`.
 */
function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/api/config')) {
      return new Response(JSON.stringify(CONFIG_RESPONSE), { status: 200 });
    }
    if (url.includes('/api/session/start')) {
      return new Response(JSON.stringify(SESSION_RESPONSE), { status: 200 });
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
  const [{ globalTotalsClient }, syncConfigModule, sessionModule] = await Promise.all([
    import('./globalTotalsClient'),
    import('./syncConfigClient'),
    import('./sessionClient'),
  ]);
  syncConfigModule.__resetSyncConfigCacheForTests();
  sessionModule.__resetSessionForTests();
  await globalTotalsClient.whenReady();
  return { globalTotalsClient, syncConfigModule, sessionModule };
}

describe('globalTotalsClient', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('never includes custom text (or anything beyond category/amount/timing metadata) in the outgoing request body', async () => {
    const { globalTotalsClient } = await freshClient();
    const fetchMock = mockFetch(async (_url, init) => {
      expect(Object.keys(JSON.parse(init?.body as string)).sort()).toEqual([
        'amount',
        'category',
        'elapsedMs',
        'idempotencyKey',
        'mode',
      ]);
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer header.signature');
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
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/config')) {
        return new Response(JSON.stringify({ ...CONFIG_RESPONSE, batchThreshold: 10 }), { status: 200 });
      }
      if (url.includes('/api/session/start')) {
        return new Response(JSON.stringify(SESSION_RESPONSE), { status: 200 });
      }
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    await syncConfigModule.getSyncConfig(true);

    for (let i = 0; i < 10; i++) globalTotalsClient.record('chant', true);
    await globalTotalsClient.sync();
    expect(incrementCalls(globalThis.fetch as ReturnType<typeof vi.fn>)).toHaveLength(1);
  });

  it('cost-protection mode (threshold 1000) reduces request frequency vs. normal mode', async () => {
    const { globalTotalsClient, syncConfigModule } = await freshClient();
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/config')) {
        return new Response(JSON.stringify({ ...CONFIG_RESPONSE, batchThreshold: 1000 }), { status: 200 });
      }
      if (url.includes('/api/session/start')) {
        return new Response(JSON.stringify(SESSION_RESPONSE), { status: 200 });
      }
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
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

  describe('server-side rejection and progressive verification', () => {
    it('drops a batch the server rejected (422) — never retried, never re-applied', async () => {
      const { globalTotalsClient } = await freshClient();
      const fetchMock = mockFetch(async () => new Response(null, { status: 422 }));
      vi.stubGlobal('fetch', fetchMock);

      globalTotalsClient.record('chant', true);
      globalTotalsClient.flushPendingNow();
      await globalTotalsClient.sync();

      expect(globalTotalsClient.getState().queue).toHaveLength(0);
      expect(globalTotalsClient.getState().consecutiveFailures).toBe(0); // not treated as a network failure
    });

    it('drops a batch after a failed verification challenge (403) without retrying', async () => {
      const { globalTotalsClient } = await freshClient();
      const fetchMock = mockFetch(async () => new Response(null, { status: 403 }));
      vi.stubGlobal('fetch', fetchMock);

      globalTotalsClient.record('chant', true);
      globalTotalsClient.flushPendingNow();
      await globalTotalsClient.sync();

      expect(globalTotalsClient.getState().queue).toHaveLength(0);
    });

    it('when a challenge (428) is issued, solves it via the registered solver and resends with the token', async () => {
      const { globalTotalsClient } = await freshClient();
      let sawTurnstileToken: string | undefined;
      const fetchMock = mockFetch(async (_url, init) => {
        const body = JSON.parse(init?.body as string);
        if (!body.turnstileToken) {
          return new Response(JSON.stringify({ challengeRequired: true, turnstileSiteKey: 'test-site-key' }), {
            status: 428,
          });
        }
        sawTurnstileToken = body.turnstileToken;
        return new Response(null, { status: 200 });
      });
      vi.stubGlobal('fetch', fetchMock);
      globalTotalsClient.setChallengeSolver(async (siteKey) => {
        expect(siteKey).toBe('test-site-key');
        return 'solved-turnstile-token';
      });

      globalTotalsClient.record('chant', true);
      globalTotalsClient.flushPendingNow();
      await globalTotalsClient.sync();

      expect(sawTurnstileToken).toBe('solved-turnstile-token');
      expect(globalTotalsClient.getState().queue).toHaveLength(0);
      globalTotalsClient.setChallengeSolver(null);
    });

    it('backs off (without dropping the batch) when a challenge is issued but no solver is mounted', async () => {
      const { globalTotalsClient } = await freshClient();
      const fetchMock = mockFetch(
        async () =>
          new Response(JSON.stringify({ challengeRequired: true, turnstileSiteKey: 'test-site-key' }), {
            status: 428,
          }),
      );
      vi.stubGlobal('fetch', fetchMock);

      globalTotalsClient.record('chant', true);
      globalTotalsClient.flushPendingNow();
      await globalTotalsClient.sync();

      expect(globalTotalsClient.getState().queue).toHaveLength(1); // kept, not lost
      expect(globalTotalsClient.getState().consecutiveFailures).toBe(1);
    });

    it('invalidates the cached session and backs off on a 401 (expired/invalid session)', async () => {
      const { globalTotalsClient, sessionModule } = await freshClient();
      const fetchMock = mockFetch(async () => new Response(null, { status: 401 }));
      vi.stubGlobal('fetch', fetchMock);

      globalTotalsClient.record('chant', true);
      globalTotalsClient.flushPendingNow();
      await globalTotalsClient.sync();

      expect(globalTotalsClient.getState().queue).toHaveLength(1); // kept — will retry with a fresh session
      expect(sessionModule.getCachedSessionToken()).toBeNull();
    });
  });
});
