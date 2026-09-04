import { describe, expect, it } from 'vitest';
import { DAILY_THOUGHTS, thoughtForToday } from './dailyThoughts';

describe('dailyThoughts', () => {
  it('has exactly 365 entries', () => {
    expect(DAILY_THOUGHTS.length).toBe(365);
  });

  it('has no duplicate entries', () => {
    expect(new Set(DAILY_THOUGHTS).size).toBe(DAILY_THOUGHTS.length);
  });

  it('returns the first thought on January 1st', () => {
    expect(thoughtForToday(new Date('2026-01-01T12:00:00'))).toBe(DAILY_THOUGHTS[0]);
  });

  it('returns the last thought on December 31st of a non-leap year', () => {
    expect(thoughtForToday(new Date('2026-12-31T12:00:00'))).toBe(DAILY_THOUGHTS[364]);
  });

  it('returns a different thought for a different day', () => {
    const jan1 = thoughtForToday(new Date('2026-01-01T12:00:00'));
    const jan2 = thoughtForToday(new Date('2026-01-02T12:00:00'));
    expect(jan1).not.toBe(jan2);
  });

  it('clamps day 366 of a leap year to the last thought instead of going out of bounds', () => {
    expect(thoughtForToday(new Date('2028-12-31T12:00:00'))).toBe(DAILY_THOUGHTS[364]);
  });
});
