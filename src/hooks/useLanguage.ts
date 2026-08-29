import { useEffect } from 'react';
import i18n, { loadLanguage, type SupportedLanguage } from '@/i18n';
import type { UiLanguage } from '@/lib/types';

/**
 * Keeps i18next, <html lang>, and the PWA manifest link in sync with the
 * active profile's language preference — the single source of truth for
 * language stays the profile (already persisted via AppDataContext), so
 * this hook never writes its own separate storage key.
 */
export function useLanguage(language: UiLanguage) {
  useEffect(() => {
    let cancelled = false;

    async function apply() {
      await loadLanguage(language as SupportedLanguage);
      if (cancelled) return;
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }
      document.documentElement.lang = language;

      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.href = `/manifest.${language}.webmanifest`;
      }
    }

    void apply();
    return () => {
      cancelled = true;
    };
  }, [language]);
}
