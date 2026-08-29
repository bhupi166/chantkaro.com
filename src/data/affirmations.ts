import type { PracticeOption } from '@/lib/types';

/**
 * Suggested positive affirmations. Data-only, same extensibility contract as
 * chants.ts — add, correct or hide entries here without touching UI logic.
 */
export const AFFIRMATIONS: PracticeOption[] = [
  {
    id: 'aff-i-am-peaceful',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am peaceful',
    script: 'मैं शांत हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'aff-i-am-grateful',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am grateful',
    script: 'मैं कृतज्ञ हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'aff-i-am-strong',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am strong',
    script: 'मैं मजबूत हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'aff-i-am-capable',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am capable',
    script: 'मैं सक्षम हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'aff-i-choose-positivity',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I choose positivity',
    script: 'मैं सकारात्मकता चुनता/चुनती हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'aff-i-trust-myself',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I trust myself',
    script: 'मुझे स्वयं पर विश्वास है',
    scriptLang: 'hi',
  },
  {
    id: 'aff-surrounded-by-love',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am surrounded by love',
    script: 'मैं प्रेम से घिरा/घिरी हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'aff-i-release-fear',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I release fear',
    script: 'मैं भय को छोड़ता/छोड़ती हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'aff-new-beginning',
    category: 'affirmation',
    tradition: 'universal',
    title: 'Today is a new beginning',
    script: 'आज एक नई शुरुआत है',
    scriptLang: 'hi',
  },
  {
    id: 'aff-welcome-peace',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I welcome peace into my life',
    script: 'मैं अपने जीवन में शांति का स्वागत करता/करती हूँ',
    scriptLang: 'hi',
  },
];

export function visibleAffirmations(): PracticeOption[] {
  return AFFIRMATIONS.filter((a) => !a.hidden);
}
