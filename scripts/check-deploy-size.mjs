#!/usr/bin/env node
// Fails (non-zero exit) if the production build or the Worker bundle exceed
// Cloudflare's size limits, so an oversized deploy is caught before it ships
// rather than discovered after. Run after `npm run build`:
//   node scripts/check-deploy-size.mjs

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(repoRoot, 'dist');
const workerDir = path.join(repoRoot, 'worker');
const bundledDir = path.join(workerDir, 'bundled');

// Cloudflare Pages / static assets: hard per-file limit.
const MAX_ASSET_BYTES = 25 * 1024 * 1024;
// Spec requirement: flag (not necessarily fail on) any asset over 5 MiB for manual review.
const LARGE_ASSET_WARN_BYTES = 5 * 1024 * 1024;
// Cloudflare Workers Paid plan: compressed script size limit.
const MAX_WORKER_COMPRESSED_BYTES = 10 * 1024 * 1024;

let failed = false;
const errors = [];

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full, statSync(full).size);
  }
}

function fmtMiB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

console.log('--- Chant Karo deployment size audit ---\n');

if (!existsSync(distDir)) {
  console.error(`dist/ not found at ${distDir} — run "npm run build" first.`);
  process.exit(1);
}

let distBytes = 0;
let distFiles = 0;
const largeAssets = [];
const overLimitAssets = [];
walk(distDir, (file, size) => {
  distBytes += size;
  distFiles += 1;
  if (size > MAX_ASSET_BYTES) overLimitAssets.push({ file, size });
  else if (size > LARGE_ASSET_WARN_BYTES) largeAssets.push({ file, size });
});

console.log(`dist/ output: ${fmtMiB(distBytes)} across ${distFiles} files`);

if (largeAssets.length > 0) {
  console.log('Assets over 5 MiB (review these — flagged by spec, not necessarily an error):');
  for (const a of largeAssets) console.log(`  ${path.relative(repoRoot, a.file)} — ${fmtMiB(a.size)}`);
} else {
  console.log('No dist/ assets over 5 MiB.');
}

if (overLimitAssets.length > 0) {
  failed = true;
  errors.push(`${overLimitAssets.length} asset(s) exceed Cloudflare's 25 MiB per-file limit.`);
  for (const a of overLimitAssets) {
    console.error(`  OVER LIMIT: ${path.relative(repoRoot, a.file)} — ${fmtMiB(a.size)}`);
  }
}

console.log('\nRunning worker dry-run build to measure bundle size...');
if (existsSync(bundledDir)) rmSync(bundledDir, { recursive: true, force: true });

const dryRun = spawnSync('npx wrangler deploy --outdir bundled --dry-run', {
  cwd: workerDir,
  encoding: 'utf8',
  shell: true,
});

if (dryRun.status !== 0) {
  failed = true;
  errors.push('Worker dry-run build failed — see output above.');
  console.error(dryRun.stdout);
  console.error(dryRun.stderr);
} else {
  const output = dryRun.stdout || '';
  console.log(output.trim());
  const match = output.match(/Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/i);
  if (match) {
    const gzipKiB = Number(match[2]);
    const gzipBytes = gzipKiB * 1024;
    if (gzipBytes > MAX_WORKER_COMPRESSED_BYTES) {
      failed = true;
      errors.push(
        `Worker compressed bundle (${(gzipBytes / 1024).toFixed(2)} KiB) exceeds the Workers ` +
          `Paid plan's 10 MiB compressed limit.`,
      );
    }
  } else {
    console.warn(
      'Could not parse the "Total Upload" line from wrangler output — skipping the bundle-size threshold check.',
    );
  }
}

if (existsSync(bundledDir)) rmSync(bundledDir, { recursive: true, force: true });

console.log('\n--- Summary ---');
if (failed) {
  console.error('DEPLOYMENT SIZE CHECK FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('All deployment size checks passed.');
