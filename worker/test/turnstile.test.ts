import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstileToken } from '../src/turnstile';

describe('verifyTurnstileToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when Cloudflare reports success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))));
    const result = await verifyTurnstileToken({ TURNSTILE_SECRET_KEY: 'secret' }, 'a-token', '203.0.113.9');
    expect(result).toBe(true);
  });

  it('returns false when Cloudflare reports failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))));
    const result = await verifyTurnstileToken({ TURNSTILE_SECRET_KEY: 'secret' }, 'a-token', '203.0.113.9');
    expect(result).toBe(false);
  });

  it('returns false (fails closed) on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const result = await verifyTurnstileToken({ TURNSTILE_SECRET_KEY: 'secret' }, 'a-token', '203.0.113.9');
    expect(result).toBe(false);
  });

  it('returns false (fails closed) when no secret key is configured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await verifyTurnstileToken({}, 'a-token', '203.0.113.9');
    expect(result).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns false when the token is empty', async () => {
    const result = await verifyTurnstileToken({ TURNSTILE_SECRET_KEY: 'secret' }, '', '203.0.113.9');
    expect(result).toBe(false);
  });
});
