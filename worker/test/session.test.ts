import { describe, expect, it } from 'vitest';
import { extractBearerToken, signSession, verifySession } from '../src/session';

const env = { SESSION_SIGNING_KEY: 'test-signing-key' };

describe('signSession / verifySession', () => {
  it('round-trips a valid, unexpired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signSession(env, { sid: 'abc-123', iat: now, exp: now + 3600 });
    expect(token).not.toBeNull();

    const payload = await verifySession(env, token!);
    expect(payload).toMatchObject({ sid: 'abc-123' });
  });

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signSession(env, { sid: 'abc-123', iat: now - 7200, exp: now - 3600 });
    const payload = await verifySession(env, token!);
    expect(payload).toBeNull();
  });

  it('rejects a token signed with a different key', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signSession(
      { SESSION_SIGNING_KEY: 'a-different-key' },
      { sid: 'abc-123', iat: now, exp: now + 3600 },
    );
    const payload = await verifySession(env, token!);
    expect(payload).toBeNull();
  });

  it('rejects a tampered payload even with a valid-looking signature', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signSession(env, { sid: 'victim-session', iat: now, exp: now + 3600 });
    const [payloadB64, signatureB64] = token!.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sid: 'attacker-session', iat: now, exp: now + 3600 }))
      .toString('base64url');
    const forged = `${forgedPayload}.${signatureB64}`;
    expect(forged).not.toBe(token);
    const payload = await verifySession(env, forged);
    expect(payload).toBeNull();
    // Sanity: the original, unmodified payload segment still verifies fine.
    expect(await verifySession(env, `${payloadB64}.${signatureB64}`)).toMatchObject({ sid: 'victim-session' });
  });

  it('rejects a malformed token', async () => {
    expect(await verifySession(env, 'not-a-token')).toBeNull();
    expect(await verifySession(env, '')).toBeNull();
    expect(await verifySession(env, 'a.b.c')).toBeNull();
  });

  it('returns null (fails closed) when no signing key is configured', async () => {
    const noKeyEnv = {};
    expect(await signSession(noKeyEnv, { sid: 'x', iat: 0, exp: 999_999_999_999 })).toBeNull();
    const token = await signSession(env, { sid: 'x', iat: 0, exp: 9_999_999_999 });
    expect(await verifySession(noKeyEnv, token!)).toBeNull();
  });
});

describe('extractBearerToken', () => {
  it('extracts a token from a well-formed Authorization header', () => {
    const req = new Request('https://example.com', { headers: { Authorization: 'Bearer abc.def' } });
    expect(extractBearerToken(req)).toBe('abc.def');
  });

  it('returns null when the header is missing or malformed', () => {
    expect(extractBearerToken(new Request('https://example.com'))).toBeNull();
    expect(
      extractBearerToken(new Request('https://example.com', { headers: { Authorization: 'Basic abc' } })),
    ).toBeNull();
    expect(
      extractBearerToken(new Request('https://example.com', { headers: { Authorization: 'Bearer ' } })),
    ).toBeNull();
  });
});
