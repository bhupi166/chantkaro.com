import { beforeEach, describe, expect, it } from 'vitest';
import { getDeviceId } from './deviceId';

beforeEach(() => {
  window.localStorage.clear();
});

describe('getDeviceId', () => {
  it('generates a random id and persists it across calls', () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(0);
  });

  it('generates a different id after storage is cleared', () => {
    const first = getDeviceId();
    window.localStorage.clear();
    const second = getDeviceId();
    expect(second).not.toBe(first);
  });
});
