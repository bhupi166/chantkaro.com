import { useEffect } from 'react';
import type { ThemePreference } from '@/lib/types';

/** Applies the active profile's theme preference to the document root. */
export function useTheme(theme: ThemePreference) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);
}
