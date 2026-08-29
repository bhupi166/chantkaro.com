// Must comfortably exceed the largest server-configured batch threshold
// (cost-protection mode submits every 1000 reps — see syncConfig.ts) with
// headroom for a session that ran a while before its last flush.
export const MAX_BATCH_AMOUNT = 2000;
export const MAX_BODY_BYTES = 2048;
/** A session realistically never spans longer than this between flushes. */
export const MAX_ELAPSED_MS = 24 * 60 * 60 * 1000;

export type Category = 'chant' | 'affirmation';
export type PracticeMode = 'tap' | 'voice';

export interface IncrementPayload {
  category: Category;
  amount: number;
  idempotencyKey: string;
  /** Wall-clock time (ms) the batch's repetitions were spread over — used for server-side speed checks. */
  elapsedMs: number;
  mode: PracticeMode;
  /** Present only when the server previously flagged this session and asked for a challenge. */
  turnstileToken?: string;
}

export type ValidationResult = { ok: true; value: IncrementPayload } | { ok: false; error: string };

const REQUIRED_KEYS = ['category', 'amount', 'idempotencyKey', 'elapsedMs', 'mode'] as const;
const OPTIONAL_KEYS = ['turnstileToken'] as const;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9-]{8,100}$/;
const TURNSTILE_TOKEN_PATTERN = /^[A-Za-z0-9._-]{10,2048}$/;

/**
 * Validates a decoded JSON body for POST /api/increment. Deliberately
 * strict: a closed set of required fields plus one optional field, a
 * closed set of categories/modes, a bounded positive integer amount, and
 * shape-checked keys/tokens. Nothing here can carry chant text, voice, or
 * identity — the type itself has no field for it.
 */
export function validateIncrementPayload(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const keys = Object.keys(obj);
  const allowedKeys: readonly string[] = [...REQUIRED_KEYS, ...OPTIONAL_KEYS];
  const hasOnlyAllowedKeys = keys.every((k) => allowedKeys.includes(k));
  const hasAllRequiredKeys = REQUIRED_KEYS.every((k) => keys.includes(k));
  if (!hasOnlyAllowedKeys || !hasAllRequiredKeys) {
    return {
      ok: false,
      error:
        'Request body must contain category, amount, idempotencyKey, elapsedMs and mode (turnstileToken optional).',
    };
  }

  const { category, amount, idempotencyKey, elapsedMs, mode, turnstileToken } = obj;

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
  if (
    typeof elapsedMs !== 'number' ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0 ||
    elapsedMs > MAX_ELAPSED_MS
  ) {
    return { ok: false, error: 'elapsedMs must be a non-negative number within a realistic range.' };
  }
  if (mode !== 'tap' && mode !== 'voice') {
    return { ok: false, error: 'mode must be "tap" or "voice".' };
  }
  if (turnstileToken !== undefined) {
    if (typeof turnstileToken !== 'string' || !TURNSTILE_TOKEN_PATTERN.test(turnstileToken)) {
      return { ok: false, error: 'turnstileToken is malformed.' };
    }
  }

  return {
    ok: true,
    value: { category, amount, idempotencyKey, elapsedMs, mode, turnstileToken },
  };
}
