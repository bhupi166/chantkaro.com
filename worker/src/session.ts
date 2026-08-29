/**
 * Short-lived, server-signed session tokens (HMAC-SHA256 via Web Crypto —
 * no external JWT library needed). A genuine practice session calls
 * POST /api/session/start once; the returned token must accompany every
 * POST /api/increment batch and is verified here before anything touches
 * the global totals. This is what makes "never trust a repetition count
 * submitted directly by the browser" enforceable — the token proves the
 * batch is tied to a session the server itself issued and is still
 * tracking, not an arbitrary POST from a script.
 */

export interface SessionPayload {
  /** Session id — also the primary key of the `sessions` D1 row. */
  sid: string;
  /** Issued-at, epoch seconds. */
  iat: number;
  /** Expiry, epoch seconds. */
  exp: number;
}

export interface SessionEnv {
  SESSION_SIGNING_KEY?: string;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSession(env: SessionEnv, payload: SessionPayload): Promise<string | null> {
  if (!env.SESSION_SIGNING_KEY) return null;
  const key = await importSigningKey(env.SESSION_SIGNING_KEY);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/** Verifies signature and expiry. Never throws — a malformed token is just invalid. */
export async function verifySession(env: SessionEnv, token: string): Promise<SessionPayload | null> {
  if (!env.SESSION_SIGNING_KEY) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signatureB64] = parts;

  try {
    const key = await importSigningKey(env.SESSION_SIGNING_KEY);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signatureB64),
      new TextEncoder().encode(payloadB64),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as SessionPayload;
    if (
      typeof payload.sid !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

/**
 * The Authorization header is the primary, authoritative way a session
 * token travels — but `navigator.sendBeacon` (used for a best-effort
 * delivery attempt on page unload) cannot set custom headers at all, so a
 * `?token=` query parameter is accepted as a fallback for that one path
 * only. Nothing sensitive beyond the already-short-lived session token
 * itself appears in either place, and this Worker does not log request
 * URLs anywhere.
 */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    if (token.length > 0) return token;
  }
  const queryToken = new URL(request.url).searchParams.get('token');
  return queryToken && queryToken.length > 0 ? queryToken : null;
}
