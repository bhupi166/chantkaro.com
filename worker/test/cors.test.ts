import { describe, expect, it } from 'vitest';
import { buildCorsHeaders, parseAllowedOrigins } from '../src/cors';

describe('parseAllowedOrigins', () => {
  it('splits a comma-separated list and trims whitespace', () => {
    expect(parseAllowedOrigins('https://a.com, https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('returns an empty array for undefined/empty input', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(parseAllowedOrigins('')).toEqual([]);
  });
});

describe('buildCorsHeaders', () => {
  const allowed = ['https://chantkaro.com'];

  it('echoes back an allowed origin', () => {
    const headers = buildCorsHeaders('https://chantkaro.com', allowed);
    expect(headers.get('Access-Control-Allow-Origin')).toBe('https://chantkaro.com');
  });

  it('omits Allow-Origin for a disallowed origin', () => {
    const headers = buildCorsHeaders('https://evil.example', allowed);
    expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('omits Allow-Origin when there is no Origin header (non-browser request)', () => {
    const headers = buildCorsHeaders(null, allowed);
    expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
