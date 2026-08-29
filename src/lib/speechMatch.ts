/**
 * Pure text-matching helpers for Voice Mode. Kept free of any Web Speech API
 * dependency so repetition-counting logic is fully unit-testable.
 */

/** Normalizes away harmless differences in case, punctuation and spacing. */
export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[.,!?؟।॥"'’‘“”\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Counts non-overlapping occurrences of `phrase` inside `transcript`, both
 * normalized first. Whole-word matching on the normalized token stream, so
 * "Om Namah Shivaya Om Namah Shivaya" counts as 2, and a stray partial
 * trailing match ("...Om Namah") does not count as a 3rd.
 */
export function countPhraseOccurrences(transcript: string, phrase: string): number {
  const phraseWords = normalizePhrase(phrase).split(' ').filter(Boolean);
  if (phraseWords.length === 0) return 0;
  const words = normalizePhrase(transcript).split(' ').filter(Boolean);

  let count = 0;
  let i = 0;
  while (i <= words.length - phraseWords.length) {
    let matches = true;
    for (let j = 0; j < phraseWords.length; j++) {
      if (words[i + j] !== phraseWords[j]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      count += 1;
      i += phraseWords.length; // non-overlapping
    } else {
      i += 1;
    }
  }
  return count;
}
