import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe('Accessibility — main journey', () => {
  test('home page', async ({ page }) => {
    await page.goto('/');
    await expectNoSeriousViolations(page);
  });

  test('choose activity page', async ({ page }) => {
    await page.goto('/choose');
    await expectNoSeriousViolations(page);
  });

  test('chant selection page', async ({ page }) => {
    await page.goto('/chant');
    await expectNoSeriousViolations(page);
  });

  test('tap mode', async ({ page }) => {
    await page.goto('/chant');
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();
    await expect(page.getByRole('button', { name: /tap to count/i })).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('settings page', async ({ page }) => {
    await page.goto('/settings');
    await expectNoSeriousViolations(page);
  });

  test('children affirmations page', async ({ page }) => {
    await page.goto('/affirmation/children');
    await expectNoSeriousViolations(page);
  });

  test('parents affirmations page', async ({ page }) => {
    await page.goto('/affirmation/parents');
    await expectNoSeriousViolations(page);
  });

  test('professional affirmations: category picker', async ({ page }) => {
    await page.goto('/affirmation/professional');
    await expectNoSeriousViolations(page);
  });

  test('professional affirmations: a chosen category', async ({ page }) => {
    await page.goto('/affirmation/professional');
    await page.getByRole('button', { name: 'Teacher', exact: true }).click();
    await expectNoSeriousViolations(page);
  });

  test('benefits page', async ({ page }) => {
    await page.goto('/benefits');
    await expectNoSeriousViolations(page);
  });
});
