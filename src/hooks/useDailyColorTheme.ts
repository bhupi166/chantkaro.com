import { useEffect } from 'react';
import { accentForDay } from '@/lib/dailyColorTheme';

const VARS = [
  '--daily-accent-light',
  '--daily-accent-contrast-light',
  '--daily-accent-dark',
  '--daily-accent-contrast-dark',
] as const;

/**
 * When enabled, sets the day's accent colour as CSS custom properties that
 * index.css's --accent/--accent-contrast fall back to (see `var(--daily-accent-light, ...)`),
 * so light/dark mode and the existing default palette keep working exactly
 * as before whenever this is off. Re-checks on tab focus so a tab left open
 * across midnight picks up the new day without needing a reload.
 */
export function useDailyColorTheme(enabled: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      for (const name of VARS) root.style.removeProperty(name);
      return;
    }

    const apply = () => {
      const { light, lightContrast, dark, darkContrast } = accentForDay(new Date().getDay());
      root.style.setProperty('--daily-accent-light', light);
      root.style.setProperty('--daily-accent-contrast-light', lightContrast);
      root.style.setProperty('--daily-accent-dark', dark);
      root.style.setProperty('--daily-accent-contrast-dark', darkContrast);
    };

    apply();
    document.addEventListener('visibilitychange', apply);
    return () => {
      document.removeEventListener('visibilitychange', apply);
      for (const name of VARS) root.style.removeProperty(name);
    };
  }, [enabled]);
}
