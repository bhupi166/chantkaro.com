import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SYNC_CONFIG,
  getCachedSyncConfig,
  getSyncConfig,
  __resetSyncConfigCacheForTests,
} from './syncConfigClient';

beforeEach(() => {
  __resetSyncConfigCacheForTests();
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getSyncConfig', () => {
  it('fetches and returns the server config', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            mode: 'elevated',
            batchThreshold: 250,
            totalsRefreshSeconds: 200,
            submissionsPaused: false,
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
          { status: 200 },
        ),
      ),
    );
    const config = await getSyncConfig();
    expect(config.mode).toBe('elevated');
    expect(config.batchThreshold).toBe(250);
  });

  it('does not re-fetch within the throttle window', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ ...DEFAULT_SYNC_CONFIG, updatedAt: 'x' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await getSyncConfig();
    await getSyncConfig();
    await getSyncConfig();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the built-in default when the server has never been reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const config = await getSyncConfig();
    expect(config).toMatchObject({ mode: 'normal', batchThreshold: 100 });
  });

  it('falls back gracefully on a malformed response instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ oops: true }), { status: 200 })));
    await expect(getSyncConfig()).resolves.toMatchObject({ mode: 'normal' });
  });

  it('a config-fetch failure never throws — personal counting must never be blocked by it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })));
    await expect(getSyncConfig()).resolves.toBeDefined();
  });
});

describe('getCachedSyncConfig', () => {
  it('returns the default before any fetch has completed', () => {
    expect(getCachedSyncConfig()).toEqual(DEFAULT_SYNC_CONFIG);
  });
});
