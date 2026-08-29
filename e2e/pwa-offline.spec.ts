import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4173' });

test('the installed service worker serves the app shell while fully offline', async ({
  page,
  context,
  browserName,
}) => {
  // WebKit's Playwright driver throws on reload() while context.setOffline
  // is combined with an active service worker (an engine/driver limitation,
  // not app behavior) — Chromium and Android coverage of this same
  // assertion, plus WebKit's own client-side offline-tap.spec.ts, already
  // exercise the real offline path.
  test.skip(
    browserName === 'webkit',
    'WebKit + Playwright offline emulation is unreliable with an active service worker',
  );
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true));
  // Give the precache a moment to finish installing assets.
  await page.waitForTimeout(1000);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Chant Karo' })).toBeVisible();
  await context.setOffline(false);
});

test('a direct visit to a sub-route (not just "/") renders the real page, not the offline/fallback shell', async ({
  page,
}) => {
  // Regression test: navigateFallback was once misconfigured to a static
  // "You're offline" page, which Workbox then served for every navigation
  // request that wasn't individually precached — including a direct visit
  // to /settings while fully online. It must serve the real SPA shell.
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true));
  await page.waitForTimeout(1000);

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText(/you're offline/i)).not.toBeVisible();

  // A hard reload on that same sub-route must behave the same way.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});
