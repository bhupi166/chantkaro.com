import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('locale files stay in sync', () => {
  const enKeys = flattenKeys(en).sort();

  it('hi.json has exactly the same keys as en.json', () => {
    expect(flattenKeys(hi).sort()).toEqual(enKeys);
  });

  it('pa.json has exactly the same keys as en.json', () => {
    expect(flattenKeys(pa).sort()).toEqual(enKeys);
  });

  it('no translation value is an empty string', () => {
    for (const [name, dict] of [
      ['en', en],
      ['hi', hi],
      ['pa', pa],
    ] as const) {
      const empties = flattenKeys(dict).filter((key) => {
        const value = key
          .split('.')
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], dict);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(empties, `${name}.json has empty values at: ${empties.join(', ')}`).toEqual([]);
    }
  });
});
