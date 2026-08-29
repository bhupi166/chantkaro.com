import { describe, expect, it } from 'vitest';
import { MAX_BATCH_AMOUNT, validateIncrementPayload } from '../src/validate';

describe('validateIncrementPayload', () => {
  it('accepts a well-formed payload', () => {
    const result = validateIncrementPayload({
      category: 'chant',
      amount: 12,
      idempotencyKey: 'abcdefgh-1234-uuid-like-key',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a category outside chant/affirmation', () => {
    const result = validateIncrementPayload({
      category: 'prayer-power',
      amount: 1,
      idempotencyKey: 'abcdefgh12345678',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-positive or non-integer amount', () => {
    for (const amount of [0, -5, 1.5, Number.NaN]) {
      const result = validateIncrementPayload({
        category: 'chant',
        amount,
        idempotencyKey: 'abcdefgh12345678',
      });
      expect(result.ok).toBe(false);
    }
  });

  it('rejects an amount above the maximum batch size', () => {
    const result = validateIncrementPayload({
      category: 'chant',
      amount: MAX_BATCH_AMOUNT + 1,
      idempotencyKey: 'abcdefgh12345678',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a malformed idempotency key', () => {
    const result = validateIncrementPayload({
      category: 'chant',
      amount: 1,
      idempotencyKey: 'short',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects unexpected extra fields (e.g. chant text sneaking in)', () => {
    const result = validateIncrementPayload({
      category: 'chant',
      amount: 1,
      idempotencyKey: 'abcdefgh12345678',
      chantText: 'Om Namah Shivaya',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = validateIncrementPayload({ category: 'chant', amount: 1 });
    expect(result.ok).toBe(false);
  });

  it('rejects non-object bodies', () => {
    expect(validateIncrementPayload(null).ok).toBe(false);
    expect(validateIncrementPayload('chant').ok).toBe(false);
    expect(validateIncrementPayload([1, 2, 3]).ok).toBe(false);
  });
});
