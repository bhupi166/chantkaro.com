import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeD1 } from './fakeD1';
import {
  checkStorageThresholds,
  countBatchesSince,
  getSyncConfig,
  getUsageSnapshot,
  IDEMPOTENCY_RETENTION_HOURS,
  pruneExpiredIdempotencyKeys,
  storageWarningMessage,
  updateSyncConfig,
  type DbEnv,
} from '../src/db';

function makeEnv() {
  return { DB: createFakeD1() } as unknown as DbEnv & { DB: ReturnType<typeof createFakeD1> };
}

describe('getSyncConfig / updateSyncConfig', () => {
  it('returns the seeded default config', async () => {
    const env = makeEnv();
    const config = await getSyncConfig(env);
    expect(config).toMatchObject({
      mode: 'normal',
      batchThreshold: 100,
      totalsRefreshSeconds: 45,
      submissionsPaused: false,
      autoManaged: true,
    });
  });

  it('applies a partial patch, leaving other fields untouched', async () => {
    const env = makeEnv();
    const updated = await updateSyncConfig(env, { batchThreshold: 250 });
    expect(updated.batchThreshold).toBe(250);
    expect(updated.mode).toBe('normal'); // unchanged
  });

  it('can pause and later resume submissions', async () => {
    const env = makeEnv();
    await updateSyncConfig(env, { submissionsPaused: true });
    expect((await getSyncConfig(env)).submissionsPaused).toBe(true);
    await updateSyncConfig(env, { submissionsPaused: false });
    expect((await getSyncConfig(env)).submissionsPaused).toBe(false);
  });
});

describe('pruneExpiredIdempotencyKeys', () => {
  it('removes only keys older than the retention window', async () => {
    const env = makeEnv();
    const db = env.DB;

    // A "fresh" key, inserted normally.
    await db
      .prepare('INSERT INTO idempotency_keys (idempotency_key, category, amount) VALUES (?1, ?2, ?3)')
      .bind('fresh-key', 'chant', 1)
      .run();

    // A stale key, backdated past the retention window.
    db.idempotencyKeys.set('stale-key', {
      category: 'affirmation',
      amount: 1,
      createdAt: new Date(Date.now() - (IDEMPOTENCY_RETENTION_HOURS + 1) * 60 * 60 * 1000).toISOString(),
    });

    const removed = await pruneExpiredIdempotencyKeys(env);
    expect(removed).toBe(1);
    expect(db.idempotencyKeys.has('fresh-key')).toBe(true);
    expect(db.idempotencyKeys.has('stale-key')).toBe(false);
  });

  it('is a no-op when nothing has expired', async () => {
    const env = makeEnv();
    const removed = await pruneExpiredIdempotencyKeys(env);
    expect(removed).toBe(0);
  });
});

describe('countBatchesSince', () => {
  let env: ReturnType<typeof makeEnv>;

  beforeEach(() => {
    env = makeEnv();
  });

  it('counts only rows created at or after the cutoff', async () => {
    env.DB.idempotencyKeys.set('old', {
      category: 'chant',
      amount: 1,
      createdAt: '2020-01-01T00:00:00.000Z',
    });
    env.DB.idempotencyKeys.set('recent', {
      category: 'chant',
      amount: 1,
      createdAt: '2026-06-01T00:00:00.000Z',
    });
    const count = await countBatchesSince(env, '2026-01-01T00:00:00.000Z');
    expect(count).toBe(1);
  });
});

describe('getUsageSnapshot', () => {
  it('reports row counts, config and an estimated-storage figure with no personal data', async () => {
    const env = makeEnv();
    const snapshot = await getUsageSnapshot(env);
    expect(snapshot.idempotencyKeyRows).toBe(0);
    expect(snapshot.rateLimitRows).toBe(0);
    expect(snapshot.config.mode).toBe('normal');
    expect(snapshot.estimatedStorage).toHaveProperty('percentOfIncluded');
    expect(JSON.stringify(snapshot)).not.toMatch(/name|email|phone|profile|password/i);
  });
});

describe('storageWarningMessage (pure banding logic)', () => {
  it('returns null well below any threshold', () => {
    expect(storageWarningMessage(0)).toBeNull();
    expect(storageWarningMessage(49.9)).toBeNull();
  });

  it('warns just above each threshold, and stays silent once past the narrow band', () => {
    expect(storageWarningMessage(50)).toMatch(/50%/);
    expect(storageWarningMessage(51.5)).toMatch(/50%/);
    expect(storageWarningMessage(52.5)).toBeNull(); // past the 50% band, not yet at 70%
    expect(storageWarningMessage(70)).toMatch(/70%/);
    expect(storageWarningMessage(85)).toMatch(/85%/);
  });

  it('never warns between bands', () => {
    expect(storageWarningMessage(60)).toBeNull();
    expect(storageWarningMessage(80)).toBeNull();
  });
});

describe('checkStorageThresholds', () => {
  it('does not warn for a freshly-seeded (near-empty) database', async () => {
    const env = makeEnv();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await checkStorageThresholds(env);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
