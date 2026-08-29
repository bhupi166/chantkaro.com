import { describe, expect, it } from 'vitest';
import { isAuthorizedAdmin } from '../src/adminAuth';

function requestWithAuth(header: string | null) {
  const headers = new Headers();
  if (header !== null) headers.set('Authorization', header);
  return new Request('https://api.chantkaro.com/api/admin/usage', { headers });
}

describe('isAuthorizedAdmin', () => {
  it('accepts a matching Bearer token', () => {
    expect(isAuthorizedAdmin(requestWithAuth('Bearer secret-token'), 'secret-token')).toBe(true);
  });

  it('rejects a wrong token', () => {
    expect(isAuthorizedAdmin(requestWithAuth('Bearer wrong'), 'secret-token')).toBe(false);
  });

  it('rejects a missing Authorization header', () => {
    expect(isAuthorizedAdmin(requestWithAuth(null), 'secret-token')).toBe(false);
  });

  it('rejects a non-Bearer scheme', () => {
    expect(isAuthorizedAdmin(requestWithAuth('Basic secret-token'), 'secret-token')).toBe(false);
  });

  it('fails closed when no admin token is configured on the server', () => {
    expect(isAuthorizedAdmin(requestWithAuth('Bearer anything'), undefined)).toBe(false);
  });
});
