import { expect, test } from '@playwright/test';

test.describe('Internationalization', () => {
  test('switching to Hindi translates the UI and persists across reload', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Interface language').selectOption('hi');

    await expect(page.getByRole('heading', { name: 'सेटिंग्स' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'होम', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'सेटिंग्स' })).toBeVisible();
  });

  test('switching to Punjabi translates the UI and persists across reload', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Interface language').selectOption('pa');

    await expect(page.getByRole('heading', { name: 'ਸੈਟਿੰਗਾਂ' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ਹੋਮ', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'ਸੈਟਿੰਗਾਂ' })).toBeVisible();
  });

  test('Hindi home page has no horizontal overflow (text-expansion check)', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Interface language').selectOption('hi');
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Punjabi home page has no horizontal overflow (text-expansion check)', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Interface language').selectOption('pa');
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('a custom chant (user-entered text) is never translated', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Interface language').selectOption('hi');

    await page.goto('/chant');
    const customBox = page.getByLabel('अपना जप या प्रार्थना दर्ज करें');
    await customBox.fill('My grandmother taught me this prayer');
    await page.getByRole('button', { name: 'यह पाठ उपयोग करें' }).click();
    await page.getByRole('button', { name: 'अभ्यास शुरू करें' }).click();

    await expect(
      page.getByRole('heading', { name: 'My grandmother taught me this prayer' }),
    ).toBeVisible();
  });

  test('the Hindi <html lang> attribute updates to match the selected language', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.getByLabel('Interface language').selectOption('hi');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  });
});
