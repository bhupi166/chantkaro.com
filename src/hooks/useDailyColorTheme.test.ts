import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDailyColorTheme } from './useDailyColorTheme';
import { accentForDay } from '@/lib/dailyColorTheme';

function clearDailyVars() {
  const root = document.documentElement;
  for (const name of [
    '--daily-accent-light',
    '--daily-accent-contrast-light',
    '--daily-accent-dark',
    '--daily-accent-contrast-dark',
  ]) {
    root.style.removeProperty(name);
  }
}

afterEach(() => {
  clearDailyVars();
  vi.useRealTimers();
});

describe('useDailyColorTheme', () => {
  it('sets no CSS variables when disabled', () => {
    renderHook(() => useDailyColorTheme(false));
    expect(document.documentElement.style.getPropertyValue('--daily-accent-light')).toBe('');
  });

  it("sets today's accent colour as CSS variables when enabled", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-04T12:00:00')); // a Sunday
    renderHook(() => useDailyColorTheme(true));

    const expected = accentForDay(0);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--daily-accent-light')).toBe(expected.light);
    expect(root.style.getPropertyValue('--daily-accent-dark')).toBe(expected.dark);
  });

  it('removes the CSS variables when turned back off', () => {
    const { rerender } = renderHook(({ enabled }) => useDailyColorTheme(enabled), {
      initialProps: { enabled: true },
    });
    expect(document.documentElement.style.getPropertyValue('--daily-accent-light')).not.toBe('');

    rerender({ enabled: false });
    expect(document.documentElement.style.getPropertyValue('--daily-accent-light')).toBe('');
  });

  it('cleans up the CSS variables on unmount', () => {
    const { unmount } = renderHook(() => useDailyColorTheme(true));
    expect(document.documentElement.style.getPropertyValue('--daily-accent-light')).not.toBe('');

    unmount();
    expect(document.documentElement.style.getPropertyValue('--daily-accent-light')).toBe('');
  });
});
