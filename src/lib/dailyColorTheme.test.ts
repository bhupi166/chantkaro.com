import { describe, expect, it } from 'vitest';
import { accentForDay, DAILY_ACCENT_COLORS } from './dailyColorTheme';

describe('accentForDay', () => {
  it('returns a distinct colour for each day of the week', () => {
    const lightColors = new Set(Array.from({ length: 7 }, (_, day) => accentForDay(day).light));
    expect(lightColors.size).toBe(7);
  });

  it('returns light and dark variants for every day', () => {
    for (let day = 0; day < 7; day++) {
      const accent = accentForDay(day);
      expect(accent.light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(accent.dark).toMatch(/^#[0-9a-f]{6}$/i);
      expect(accent.lightContrast).toMatch(/^#[0-9a-f]{6}$/i);
      expect(accent.darkContrast).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('falls back to Sunday for an out-of-range day', () => {
    expect(accentForDay(9)).toEqual(DAILY_ACCENT_COLORS[0]);
    expect(accentForDay(-1)).toEqual(DAILY_ACCENT_COLORS[0]);
  });
});
