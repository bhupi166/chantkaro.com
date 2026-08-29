/**
 * Minimal shared-secret check for the two administrator-only endpoints
 * (/api/admin/usage, /api/admin/config). No user accounts exist in this
 * system at all — this token is set once via `wrangler secret put
 * ADMIN_TOKEN` (never committed, never present in any frontend bundle) and
 * given only to whoever operates the deployment.
 */
export function isAuthorizedAdmin(request: Request, adminToken: string | undefined): boolean {
  if (!adminToken) return false; // fail closed if the secret was never set
  const header = request.headers.get('Authorization') ?? '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return false;
  return timingSafeEqual(match[1], adminToken);
}

/** Avoids leaking token length/contents via response-time differences. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) {
    // Still do a constant-time-ish pass over `a` so the early return above
    // (length check) is the only length-dependent timing signal.
    let dummy = 0;
    for (let i = 0; i < bufA.length; i++) dummy |= bufA[i];
    return false;
  }
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}
