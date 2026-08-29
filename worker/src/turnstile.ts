/**
 * Verifies a Cloudflare Turnstile token against Cloudflare's siteverify
 * endpoint. Turnstile (not the paid Bot Management product) is free and
 * privacy-respecting, and is only ever shown to the visitor when the
 * server has already flagged a session as suspicious — see security.ts
 * evaluateBatch() and index.ts. Never called on the normal, frictionless
 * path.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileEnv {
  TURNSTILE_SECRET_KEY?: string;
}

export async function verifyTurnstileToken(
  env: TurnstileEnv,
  token: string,
  remoteIp: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;
  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: remoteIp,
    });
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
