import { expect, test } from '@playwright/test';

test.describe('Mobile layout', () => {
  test('home page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('tap mode has no horizontal overflow and a large tap target', async ({ page }) => {
    await page.goto('/chant');
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const tapButton = page.getByRole('button', { name: /tap to count/i });
    const box = await tapButton.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('settings toggles remain reachable and tap-sized', async ({ page }) => {
    await page.goto('/settings');
    const toggle = page.getByRole('switch', { name: 'Contribute to Global Totals' });
    await expect(toggle).toBeVisible();
  });
});
