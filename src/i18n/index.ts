import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'pa'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** BCP-47 tags for the Web Speech API — see spec §15: en-IN/hi-IN/pa-IN. */
export const VOICE_RECOGNITION_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
};

// Only English ships in the main bundle; Hindi and Punjabi are fetched on
// demand (see loadLanguage below) so visitors who never switch language —
// most, by default — don't pay for translations they never see. This
// matters on the slower mobile networks this app is built for.
void i18next.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

const loadedLanguages = new Set<string>(['en']);

/** Fetches and registers a language's translation bundle, once. */
export async function loadLanguage(language: SupportedLanguage): Promise<void> {
  if (loadedLanguages.has(language)) return;
  const mod =
    language === 'hi' ? await import('./locales/hi.json') : await import('./locales/pa.json');
  i18next.addResourceBundle(language, 'translation', mod.default, true, true);
  loadedLanguages.add(language);
}

export default i18next;
