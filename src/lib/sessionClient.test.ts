import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetSessionForTests,
  getCachedSessionToken,
  getSessionToken,
  invalidateSessionToken,
} from './sessionClient';

function sessionResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      token: 'header.signature',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      turnstileSiteKey: 'test-site-key',
      ...overrides,
    }),
    { status: 200 },
  );
}

beforeEach(() => {
  window.localStorage.clear();
  __resetSessionForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getSessionToken', () => {
  it('starts a new session and caches it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sessionResponse());
    vi.stubGlobal('fetch', fetchMock);

    const info = await getSessionToken();
    expect(info).toMatchObject({ token: 'header.signature', turnstileSiteKey: 'test-site-key' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // A second call within the TTL should be served from cache, not re-fetched.
    await getSessionToken();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends a deviceId in the request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sessionResponse());
    vi.stubGlobal('fetch', fetchMock);

    await getSessionToken();
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(typeof body.deviceId).toBe('string');
    expect(body.deviceId.length).toBeGreaterThan(0);
  });

  it('returns null (never throws) when the server is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );
    const info = await getSessionToken();
    expect(info).toBeNull();
  });

  it('returns null on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const info = await getSessionToken();
    expect(info).toBeNull();
  });

  it('re-fetches once invalidated', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sessionResponse());
    vi.stubGlobal('fetch', fetchMock);

    await getSessionToken();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    invalidateSessionToken();
    await getSessionToken();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('re-fetches once the cached token is near expiry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(sessionResponse({ expiresAt: new Date(Date.now() + 1000).toISOString() }))
      .mockResolvedValueOnce(sessionResponse());
    vi.stubGlobal('fetch', fetchMock);

    await getSessionToken(); // caches a token expiring in 1s — well inside the safety margin
    await getSessionToken();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('getCachedSessionToken', () => {
  it('returns null before any session has been started', () => {
    expect(getCachedSessionToken()).toBeNull();
  });

  it('returns the cached token without making a network call', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sessionResponse());
    vi.stubGlobal('fetch', fetchMock);
    await getSessionToken();

    fetchMock.mockClear();
    expect(getCachedSessionToken()).toMatchObject({ token: 'header.signature' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
