import { describe, expect, it } from 'vitest';
import { countPhraseOccurrences, normalizePhrase } from './speechMatch';

describe('normalizePhrase', () => {
  it('lowercases, strips punctuation and collapses whitespace', () => {
    expect(normalizePhrase('Om Namah Shivaya!')).toBe('om namah shivaya');
    expect(normalizePhrase('  Om   Namah,  Shivaya. ')).toBe('om namah shivaya');
  });
});

describe('countPhraseOccurrences', () => {
  it('counts a single occurrence', () => {
    expect(countPhraseOccurrences('Om Namah Shivaya', 'Om Namah Shivaya')).toBe(1);
  });

  it('counts multiple repetitions in one utterance', () => {
    expect(
      countPhraseOccurrences(
        'Om Namah Shivaya Om Namah Shivaya Om Namah Shivaya',
        'Om Namah Shivaya',
      ),
    ).toBe(3);
  });

  it('ignores case and punctuation differences', () => {
    expect(countPhraseOccurrences('om namah shivaya, OM NAMAH SHIVAYA.', 'Om Namah Shivaya')).toBe(
      2,
    );
  });

  it('does not count a trailing partial match', () => {
    expect(countPhraseOccurrences('Om Namah Shivaya Om Namah', 'Om Namah Shivaya')).toBe(1);
  });

  it('returns 0 when the phrase is absent', () => {
    expect(countPhraseOccurrences('hello world', 'Om Namah Shivaya')).toBe(0);
  });

  it('does not double-count overlapping words as two matches', () => {
    // "peace peace" should only match "peace" once per non-overlapping window
    expect(countPhraseOccurrences('peace peace peace', 'peace peace')).toBe(1);
  });
});
