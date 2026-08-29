import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAppData,
  createDefaultAppData,
  exportAppDataJson,
  importAppDataJson,
  loadAppData,
  saveAppData,
  STORAGE_KEY,
} from './storage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('loadAppData', () => {
  it('creates a fresh single-profile default when nothing is stored', () => {
    const data = loadAppData();
    expect(data.profiles).toHaveLength(1);
    expect(data.activeProfileId).toBe(data.profiles[0].id);
  });

  it('recovers gracefully from corrupted JSON instead of throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(() => loadAppData()).not.toThrow();
    const data = loadAppData();
    expect(data.profiles).toHaveLength(1);
  });

  it('recovers gracefully from a structurally invalid payload', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ hello: 'world' }));
    const data = loadAppData();
    expect(data.profiles).toHaveLength(1);
  });

  it('round-trips saved data', () => {
    const data = createDefaultAppData();
    saveAppData(data);
    const reloaded = loadAppData();
    expect(reloaded.activeProfileId).toBe(data.activeProfileId);
  });
});

describe('clearAppData', () => {
  it('removes stored data and returns a fresh default', () => {
    saveAppData(createDefaultAppData());
    const fresh = clearAppData();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(fresh.profiles).toHaveLength(1);
  });
});

describe('export / import', () => {
  it('exports valid JSON that re-imports to an equivalent structure', () => {
    const data = createDefaultAppData();
    const json = exportAppDataJson(data);
    const result = importAppDataJson(json);
    expect(result.ok).toBe(true);
    expect(result.data?.activeProfileId).toBe(data.activeProfileId);
  });

  it('rejects a non-backup JSON file safely', () => {
    const result = importAppDataJson(JSON.stringify({ foo: 'bar' }));
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects malformed JSON safely', () => {
    const result = importAppDataJson('{ not json');
    expect(result.ok).toBe(false);
  });
});
