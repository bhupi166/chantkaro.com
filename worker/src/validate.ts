// Must comfortably exceed the largest server-configured batch threshold
// (cost-protection mode submits every 1000 reps — see syncConfig.ts) with
// headroom for a session that ran a while before its last flush.
export const MAX_BATCH_AMOUNT = 2000;
export const MAX_BODY_BYTES = 2048;

export type Category = 'chant' | 'affirmation';

export interface IncrementPayload {
  category: Category;
  amount: number;
  idempotencyKey: string;
}

export type ValidationResult = { ok: true; value: IncrementPayload } | { ok: false; error: string };

const ALLOWED_KEYS = ['category', 'amount', 'idempotencyKey'] as const;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9-]{8,100}$/;

/**
 * Validates a decoded JSON body for POST /api/increment. Deliberately
 * strict: an exact, small set of fields, a closed set of categories, a
 * bounded positive integer amount, and a shape-checked idempotency key.
 * Nothing here can carry chant text, voice, or identity — the type itself
 * has no field for it.
 */
export function validateIncrementPayload(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== ALLOWED_KEYS.length || !ALLOWED_KEYS.every((k) => keys.includes(k))) {
    return {
      ok: false,
      error: 'Request body must contain exactly category, amount and idempotencyKey.',
    };
  }

  const { category, amount, idempotencyKey } = obj;

  if (category !== 'chant' && category !== 'affirmation') {
    return { ok: false, error: 'category must be "chant" or "affirmation".' };
  }
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: 'amount must be a positive integer.' };
  }
  if (amount > MAX_BATCH_AMOUNT) {
    return { ok: false, error: `amount exceeds the maximum batch size of ${MAX_BATCH_AMOUNT}.` };
  }
  if (typeof idempotencyKey !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return {
      ok: false,
      error: 'idempotencyKey must be an 8-100 character string of letters, numbers and dashes.',
    };
  }

  return { ok: true, value: { category, amount, idempotencyKey } };
}
