// Generates PWA/app icons from the Chant Karo mark. Run with:
//   node scripts/generate-icons.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dirname, '..', 'public', 'icons');

const BG = '#FFF8EE';

// Same mark as public/favicon.svg / src/components/Logo.tsx, without the
// rounded background rect (added separately per output so maskable variants
// can use a full-bleed square instead).
function markSvg({ size, contentScale = 1 }) {
  const s = 64;
  const cx = 32;
  const cy = 34;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${size}" height="${size}">
    <defs>
      <linearGradient id="ck-petal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#F0955C" />
        <stop offset="100%" stop-color="#D9628A" />
      </linearGradient>
      <radialGradient id="ck-glow" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#F2D18A" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#F2D18A" stop-opacity="0" />
      </radialGradient>
    </defs>
    <g transform="translate(${cx} ${cy}) scale(${contentScale}) translate(${-cx} ${-cy})">
      <circle cx="32" cy="34" r="24" fill="url(#ck-glow)" />
      <g fill="#472C62" opacity="0.85">
        <circle cx="32" cy="9" r="2.1" /><circle cx="42" cy="12" r="1.3" /><circle cx="49" cy="19" r="1.3" />
        <circle cx="53" cy="28" r="1.3" /><circle cx="53" cy="40" r="1.3" /><circle cx="49" cy="49" r="1.3" />
        <circle cx="42" cy="56" r="2.1" /><circle cx="32" cy="59" r="1.3" /><circle cx="22" cy="56" r="1.3" />
        <circle cx="15" cy="49" r="2.1" /><circle cx="11" cy="40" r="1.3" /><circle cx="11" cy="28" r="1.3" />
        <circle cx="15" cy="19" r="1.3" /><circle cx="22" cy="12" r="2.1" />
      </g>
      <path d="M32 44c-8-4-12-12-8-20 5 2 8 8 8 20z" fill="url(#ck-petal)" />
      <path d="M32 44c8-4 12-12 8-20-5 2-8 8-8 20z" fill="url(#ck-petal)" opacity="0.92" />
      <path d="M32 46c-5-8-4-17 0-23 4 6 5 15 0 23z" fill="#F0955C" />
    </g>
  </svg>`;
}

async function renderPlain(size, fileName) {
  const svg = markSvg({ size });
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const withBg = await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: buf }])
    .png()
    .toBuffer();
  await writeFile(path.join(outDir, fileName), withBg);
}

async function renderMaskable(size, fileName) {
  // Maskable icons must tolerate an OS-applied circular/rounded-square
  // crop, so keep visual content inside the inner ~80% safe zone.
  const svg = markSvg({ size, contentScale: 0.72 });
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const withBg = await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: buf }])
    .png()
    .toBuffer();
  await writeFile(path.join(outDir, fileName), withBg);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await renderPlain(192, 'icon-192.png');
  await renderPlain(512, 'icon-512.png');
  await renderMaskable(192, 'maskable-192.png');
  await renderMaskable(512, 'maskable-512.png');
  await renderPlain(180, 'apple-touch-icon.png');
  console.log('Icons written to', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
