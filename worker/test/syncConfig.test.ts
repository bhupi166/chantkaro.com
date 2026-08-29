import { describe, expect, it } from 'vitest';
import {
  MODE_PROFILES,
  modeForMonthlyBatchCount,
  nextAutoMode,
  isSyncMode,
  AUTO_ESCALATION_THRESHOLDS,
} from '../src/syncConfig';

describe('MODE_PROFILES', () => {
  it('matches the spec batch thresholds exactly', () => {
    expect(MODE_PROFILES.normal.batchThreshold).toBe(100);
    expect(MODE_PROFILES.elevated.batchThreshold).toBe(250);
    expect(MODE_PROFILES.high.batchThreshold).toBe(500);
    expect(MODE_PROFILES['cost-protection'].batchThreshold).toBe(1000);
  });

  it('keeps every refresh interval inside its spec range', () => {
    expect(MODE_PROFILES.normal.totalsRefreshSeconds).toBeGreaterThanOrEqual(30);
    expect(MODE_PROFILES.normal.totalsRefreshSeconds).toBeLessThanOrEqual(60);
    expect(MODE_PROFILES.elevated.totalsRefreshSeconds).toBeGreaterThanOrEqual(120);
    expect(MODE_PROFILES.elevated.totalsRefreshSeconds).toBeLessThanOrEqual(300);
    expect(MODE_PROFILES['cost-protection'].totalsRefreshSeconds).toBeGreaterThanOrEqual(600);
    expect(MODE_PROFILES['cost-protection'].totalsRefreshSeconds).toBeLessThanOrEqual(900);
  });
});

describe('modeForMonthlyBatchCount', () => {
  it('stays normal below the elevated threshold', () => {
    expect(modeForMonthlyBatchCount(0)).toBe('normal');
    expect(modeForMonthlyBatchCount(AUTO_ESCALATION_THRESHOLDS.elevated - 1)).toBe('normal');
  });

  it('escalates at each threshold boundary', () => {
    expect(modeForMonthlyBatchCount(AUTO_ESCALATION_THRESHOLDS.elevated)).toBe('elevated');
    expect(modeForMonthlyBatchCount(AUTO_ESCALATION_THRESHOLDS.high)).toBe('high');
    expect(modeForMonthlyBatchCount(AUTO_ESCALATION_THRESHOLDS['cost-protection'])).toBe(
      'cost-protection',
    );
  });
});

describe('nextAutoMode', () => {
  it('escalates when usage justifies a more conservative mode', () => {
    expect(nextAutoMode('normal', AUTO_ESCALATION_THRESHOLDS.elevated)).toBe('elevated');
  });

  it('never de-escalates automatically, even if usage drops', () => {
    // A human must relax this via PATCH /api/admin/config — see spec
    // "administrator approval" requirement.
    expect(nextAutoMode('cost-protection', 0)).toBe('cost-protection');
    expect(nextAutoMode('high', 10)).toBe('high');
  });

  it('stays put when usage does not justify escalation', () => {
    expect(nextAutoMode('normal', 1)).toBe('normal');
  });
});

describe('isSyncMode', () => {
  it('accepts only the four defined modes', () => {
    expect(isSyncMode('normal')).toBe(true);
    expect(isSyncMode('cost-protection')).toBe(true);
    expect(isSyncMode('super-mode')).toBe(false);
    expect(isSyncMode(123)).toBe(false);
    expect(isSyncMode(null)).toBe(false);
  });
});
