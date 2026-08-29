const STORAGE_KEY = 'chantkaro:deviceId:v1';

/**
 * A random, non-identifying id used only to scope server-side anti-abuse
 * rate limiting (see worker/src/index.ts) to "this browser" alongside IP
 * and session-based limits. It is never combined with personal data, never
 * sent anywhere except the session-start call, and is not fingerprinting —
 * just a random value the server can rate-limit against.
 */
export function getDeviceId(): string {
  try {
    const existing = window.localStorage?.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage?.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // LocalStorage unavailable (private mode, quota, etc.) — fall back to a
    // per-load id rather than failing; it just won't persist across reloads.
    return `ephemeral-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
