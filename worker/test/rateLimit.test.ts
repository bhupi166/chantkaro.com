import { describe, expect, it } from 'vitest';
import { rateLimitBucketKey } from '../src/rateLimit';

describe('rateLimitBucketKey', () => {
  it('produces the same key for the same IP within the same time window', async () => {
    const now = new Date('2026-01-01T00:00:10Z');
    const a = await rateLimitBucketKey('203.0.113.5', now);
    const b = await rateLimitBucketKey('203.0.113.5', new Date('2026-01-01T00:00:40Z'));
    expect(a).toBe(b);
  });

  it('produces a different key for a different time window', async () => {
    const a = await rateLimitBucketKey('203.0.113.5', new Date('2026-01-01T00:00:10Z'));
    const b = await rateLimitBucketKey('203.0.113.5', new Date('2026-01-01T00:05:10Z'));
    expect(a).not.toBe(b);
  });

  it('never contains the raw IP address in its output', async () => {
    const key = await rateLimitBucketKey('203.0.113.5', new Date());
    expect(key).not.toContain('203.0.113.5');
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different keys for different IPs in the same window', async () => {
    const now = new Date();
    const a = await rateLimitBucketKey('203.0.113.5', now);
    const b = await rateLimitBucketKey('198.51.100.9', now);
    expect(a).not.toBe(b);
  });
});
