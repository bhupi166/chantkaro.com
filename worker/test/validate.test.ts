import { describe, expect, it } from 'vitest';
import { MAX_BATCH_AMOUNT, MAX_ELAPSED_MS, validateIncrementPayload } from '../src/validate';

function payload(overrides: Record<string, unknown> = {}) {
  return {
    category: 'chant',
    amount: 12,
    idempotencyKey: 'abcdefgh-1234-uuid-like-key',
    elapsedMs: 5000,
    mode: 'tap',
    ...overrides,
  };
}

describe('validateIncrementPayload', () => {
  it('accepts a well-formed payload', () => {
    const result = validateIncrementPayload(payload());
    expect(result.ok).toBe(true);
  });

  it('accepts a well-formed payload with an optional turnstileToken', () => {
    const result = validateIncrementPayload(payload({ turnstileToken: 'a-turnstile-response-token' }));
    expect(result.ok).toBe(true);
  });

  it('rejects a category outside chant/affirmation', () => {
    const result = validateIncrementPayload(payload({ category: 'prayer-power' }));
    expect(result.ok).toBe(false);
  });

  it('rejects a non-positive or non-integer amount', () => {
    for (const amount of [0, -5, 1.5, Number.NaN]) {
      const result = validateIncrementPayload(payload({ amount }));
      expect(result.ok).toBe(false);
    }
  });

  it('rejects an amount above the maximum batch size', () => {
    const result = validateIncrementPayload(payload({ amount: MAX_BATCH_AMOUNT + 1 }));
    expect(result.ok).toBe(false);
  });

  it('rejects a malformed idempotency key', () => {
    const result = validateIncrementPayload(payload({ idempotencyKey: 'short' }));
    expect(result.ok).toBe(false);
  });

  it('rejects a mode outside tap/voice', () => {
    const result = validateIncrementPayload(payload({ mode: 'script' }));
    expect(result.ok).toBe(false);
  });

  it('rejects a negative or unrealistically large elapsedMs', () => {
    expect(validateIncrementPayload(payload({ elapsedMs: -1 })).ok).toBe(false);
    expect(validateIncrementPayload(payload({ elapsedMs: MAX_ELAPSED_MS + 1 })).ok).toBe(false);
  });

  it('rejects a malformed turnstileToken', () => {
    const result = validateIncrementPayload(payload({ turnstileToken: 'x' }));
    expect(result.ok).toBe(false);
  });

  it('rejects unexpected extra fields (e.g. chant text sneaking in)', () => {
    const result = validateIncrementPayload(payload({ chantText: 'Om Namah Shivaya' }));
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
