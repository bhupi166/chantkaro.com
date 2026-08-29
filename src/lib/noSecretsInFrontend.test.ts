/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Cheap, direct check for the spec requirement "Never place billing
 * credentials or Cloudflare secrets in frontend code" — the frontend has
 * no legitimate reason to ever reference the admin token or a Cloudflare
 * API/account credential, so any occurrence at all is a bug worth failing
 * the build over.
 */
const FORBIDDEN_PATTERNS = [
  /ADMIN_TOKEN\s*[:=]\s*['"][^'"]+['"]/i, // an actual assigned value, not just the identifier
  /CLOUDFLARE_API_TOKEN/i,
  /CF_API_TOKEN/i,
  /cloudflare[_-]?account[_-]?id\s*[:=]\s*['"][^'"]+['"]/i,
];

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const srcDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

describe('no secrets in frontend source', () => {
  it('contains no admin token, Cloudflare API token or account-id assignment anywhere under src/', () => {
    const files = collectSourceFiles(srcDir);
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) offenders.push(`${file} matched ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
