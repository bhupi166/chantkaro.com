import { describe, expect, it } from 'vitest';
import { CHANTS } from './chants';
import { AFFIRMATIONS } from './affirmations';
import { CHILDREN_AFFIRMATIONS } from './childrenAffirmations';
import { PARENTS_AFFIRMATIONS } from './parentsAffirmations';
import { PROFESSIONAL_AFFIRMATIONS, PROFESSION_CATEGORIES } from './professionalAffirmations';

describe('practice option data integrity', () => {
  it('has no duplicate ids across every suggested chant/affirmation catalog', () => {
    const all = [
      ...CHANTS,
      ...AFFIRMATIONS,
      ...CHILDREN_AFFIRMATIONS,
      ...PARENTS_AFFIRMATIONS,
      ...Object.values(PROFESSIONAL_AFFIRMATIONS).flat(),
    ];
    const ids = all.map((o) => o.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it('every profession category key is unique', () => {
    const keys = PROFESSION_CATEGORIES.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every profession affirmation list is keyed by a real profession category', () => {
    const validKeys = new Set(PROFESSION_CATEGORIES.map((p) => p.key));
    for (const key of Object.keys(PROFESSIONAL_AFFIRMATIONS)) {
      expect(validKeys.has(key)).toBe(true);
    }
  });

  it('every profession affirmation option is category "affirmation"', () => {
    for (const options of Object.values(PROFESSIONAL_AFFIRMATIONS)) {
      for (const option of options) {
        expect(option.category).toBe('affirmation');
      }
    }
  });
});
