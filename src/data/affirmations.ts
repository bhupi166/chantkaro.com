import type { PracticeOption } from '@/lib/types';

/**
 * Suggested positive affirmations. Data-only, same extensibility contract as
 * chants.ts — add, correct or hide entries here without touching UI logic.
 *
 * `titleTranslations` drives the primary displayed text once the interface
 * language is Hindi/Punjabi (see src/lib/practiceLocalization.ts); `script`
 * stays as the always-visible Devanagari line regardless of UI language,
 * matching the original bilingual-display design.
 */
export const AFFIRMATIONS: PracticeOption[] = [
  {
    id: 'aff-i-am-peaceful',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am peaceful',
    script: 'मैं शांत हूँ',
    scriptLang: 'hi',
    titleTranslations: { hi: 'मैं शांत हूँ', pa: 'ਮੈਂ ਸ਼ਾਂਤ ਹਾਂ' },
  },
  {
    id: 'aff-i-am-grateful',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am grateful',
    script: 'मैं कृतज्ञ हूँ',
    scriptLang: 'hi',
    titleTranslations: { hi: 'मैं कृतज्ञ हूँ', pa: 'ਮੈਂ ਸ਼ੁਕਰਗੁਜ਼ਾਰ ਹਾਂ' },
  },
  {
    id: 'aff-i-am-strong',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am strong',
    script: 'मैं मजबूत हूँ',
    scriptLang: 'hi',
    titleTranslations: { hi: 'मैं मजबूत हूँ', pa: 'ਮੈਂ ਮਜ਼ਬੂਤ ਹਾਂ' },
  },
  {
    id: 'aff-i-am-capable',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am capable',
    script: 'मैं सक्षम हूँ',
    scriptLang: 'hi',
    titleTranslations: { hi: 'मैं सक्षम हूँ', pa: 'ਮੈਂ ਸਮਰੱਥ ਹਾਂ' },
  },
  {
    id: 'aff-i-choose-positivity',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I choose positivity',
    script: 'मैं सकारात्मकता चुनता/चुनती हूँ',
    scriptLang: 'hi',
    titleTranslations: {
      hi: 'मैं सकारात्मकता चुनता/चुनती हूँ',
      pa: 'ਮੈਂ ਸਕਾਰਾਤਮਕਤਾ ਚੁਣਦਾ/ਚੁਣਦੀ ਹਾਂ',
    },
  },
  {
    id: 'aff-i-trust-myself',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I trust myself',
    script: 'मुझे स्वयं पर विश्वास है',
    scriptLang: 'hi',
    titleTranslations: { hi: 'मुझे स्वयं पर विश्वास है', pa: "ਮੈਨੂੰ ਆਪਣੇ ਆਪ 'ਤੇ ਭਰੋਸਾ ਹੈ" },
  },
  {
    id: 'aff-surrounded-by-love',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am surrounded by love',
    script: 'मैं प्रेम से घिरा/घिरी हूँ',
    scriptLang: 'hi',
    titleTranslations: { hi: 'मैं प्रेम से घिरा/घिरी हूँ', pa: 'ਮੈਂ ਪਿਆਰ ਨਾਲ ਘਿਰਿਆ/ਘਿਰੀ ਹਾਂ' },
  },
  {
    id: 'aff-i-release-fear',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I release fear',
    script: 'मैं भय को छोड़ता/छोड़ती हूँ',
    scriptLang: 'hi',
    titleTranslations: { hi: 'मैं भय को छोड़ता/छोड़ती हूँ', pa: 'ਮੈਂ ਡਰ ਨੂੰ ਛੱਡਦਾ/ਛੱਡਦੀ ਹਾਂ' },
  },
  {
    id: 'aff-new-beginning',
    category: 'affirmation',
    tradition: 'universal',
    title: 'Today is a new beginning',
    script: 'आज एक नई शुरुआत है',
    scriptLang: 'hi',
    titleTranslations: { hi: 'आज एक नई शुरुआत है', pa: 'ਅੱਜ ਇੱਕ ਨਵੀਂ ਸ਼ੁਰੂਆਤ ਹੈ' },
  },
  {
    id: 'aff-welcome-peace',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I welcome peace into my life',
    script: 'मैं अपने जीवन में शांति का स्वागत करता/करती हूँ',
    scriptLang: 'hi',
    titleTranslations: {
      hi: 'मैं अपने जीवन में शांति का स्वागत करता/करती हूँ',
      pa: 'ਮੈਂ ਆਪਣੇ ਜੀਵਨ ਵਿੱਚ ਸ਼ਾਂਤੀ ਦਾ ਸੁਆਗਤ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ',
    },
  },
];

export function visibleAffirmations(): PracticeOption[] {
  return AFFIRMATIONS.filter((a) => !a.hidden);
}
