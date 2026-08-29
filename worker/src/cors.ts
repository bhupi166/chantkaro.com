export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Only echoes back Access-Control-Allow-Origin when the request's Origin is
 * on the configured allowlist; otherwise omits it so browsers block
 * cross-origin reads from unapproved sites.
 */
export function buildCorsHeaders(requestOrigin: string | null, allowedOrigins: string[]): Headers {
  const headers = new Headers();
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}
