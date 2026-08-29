export const RATE_LIMIT_WINDOW_MINUTES = 1;
export const RATE_LIMIT_MAX_REQUESTS = 20;
/** Rows older than this are safe to prune — never kept longer than needed. */
export const RATE_LIMIT_RETENTION_MS = 2 * 60 * 60 * 1000;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derives a rate-limit bucket key from the caller's IP and the current
 * short time window. The IP itself is never stored — only this hash, which
 * rotates every window and is pruned within hours, so it never functions as
 * a persistent device fingerprint.
 */
export async function rateLimitBucketKey(ip: string, now: Date = new Date()): Promise<string> {
  const windowIndex = Math.floor(now.getTime() / (RATE_LIMIT_WINDOW_MINUTES * 60_000));
  return sha256Hex(`${ip}:${windowIndex}`);
}

export interface RateLimitEnv {
  DB: D1Database;
}

export async function checkAndIncrementRateLimit(env: RateLimitEnv, ip: string): Promise<boolean> {
  const bucketKey = await rateLimitBucketKey(ip);
  const nowIso = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket_key, count, window_start)
     VALUES (?1, 1, ?2)
     ON CONFLICT(bucket_key) DO UPDATE SET count = count + 1
     RETURNING count`,
  )
    .bind(bucketKey, nowIso)
    .first<{ count: number }>();

  const count = result?.count ?? 1;
  return count <= RATE_LIMIT_MAX_REQUESTS;
}

export async function pruneExpiredRateLimits(env: RateLimitEnv): Promise<void> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_RETENTION_MS).toISOString();
  await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?1').bind(cutoff).run();
}
