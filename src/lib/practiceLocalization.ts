import type { PracticeOption } from './types';

/**
 * Resolves the text to display/count for a suggested option in the current
 * UI language. Chant/prayer titles are transliterated proper nouns and
 * never change with UI language — only affirmations are translated, since
 * they are ordinary descriptive sentences rather than sacred names.
 */
export function localizedOptionTitle(option: PracticeOption, language: string): string {
  if (option.category !== 'affirmation') return option.title;
  const translated = option.titleTranslations?.[language as 'hi' | 'pa'];
  return translated ?? option.title;
}
