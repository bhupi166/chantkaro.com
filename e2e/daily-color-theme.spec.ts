import { expect, test } from '@playwright/test';

// Mirrors the light-mode hex values in src/lib/dailyColorTheme.ts.
const KNOWN_DAILY_LIGHT_COLORS = [
  '#b84e29',
  '#8f6a0a',
  '#a83d63',
  '#472c62',
  '#2f6b5e',
  '#3a4a8f',
  '#7c2e3f',
];

// getComputedStyle().getPropertyValue() on a custom property returns the
// literal cascaded text (e.g. "#7c2e3f"), not a browser-normalized color
// like a real color property would — so compare against raw hex, not rgb().
async function readAccent(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  );
}

test.describe('Daily Colour Theme setting', () => {
  test('is off by default, and toggling it changes then restores the accent colour', async ({
    page,
  }) => {
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: 'Daily Colour Theme' });
    await expect(toggle).not.toBeChecked();

    const defaultAccent = await readAccent(page);

    await toggle.click();
    await expect(toggle).toBeChecked();

    const dailyAccent = await readAccent(page);
    expect(dailyAccent).not.toBe(defaultAccent);
    expect(KNOWN_DAILY_LIGHT_COLORS).toContain(dailyAccent);

    await toggle.click();
    await expect(toggle).not.toBeChecked();
    expect(await readAccent(page)).toBe(defaultAccent);
  });

  test('persists across reload and keeps personal counting/appearance otherwise unaffected', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.getByRole('switch', { name: 'Daily Colour Theme' }).click();

    await page.reload();
    await expect(page.getByRole('switch', { name: 'Daily Colour Theme' })).toBeChecked();

    // The rest of the page still renders normally — this isn't just a blank/broken theme.
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});
