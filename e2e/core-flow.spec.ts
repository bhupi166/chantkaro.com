import { expect, test } from '@playwright/test';

test.describe('Core practice flow', () => {
  test('never asks for login, registration or personal details', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Chant Karo' })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.getByText(/log in|sign in|register|create an account/i)).toHaveCount(0);
  });

  test('Start Your Practice → choose a chant → Tap Mode counts and persists after reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Start Your Practice' }).click();

    await expect(
      page.getByRole('heading', { name: /what would you like to practise today/i }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Choose Chant or Prayer' }).click();

    await expect(
      page.getByRole('heading', { name: /what would you like to chant/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();

    const tapButton = page.getByRole('button', { name: /tap to count/i });
    await expect(tapButton).toBeVisible();

    for (let i = 0; i < 5; i++) {
      await tapButton.click();
    }
    await expect(tapButton).toContainText('5');

    await page.reload();
    const tapButtonAfterReload = page.getByRole('button', { name: /tap to count/i });
    await expect(tapButtonAfterReload).toContainText('5');
  });

  test('affirmation flow reaches Tap Mode with the selected affirmation shown', async ({
    page,
  }) => {
    await page.goto('/choose');
    await page.getByRole('link', { name: 'Choose an Affirmation' }).click();
    await expect(
      page.getByRole('heading', { name: /which positive affirmation would you like to repeat/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'I am peaceful', exact: false }).first().click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();
    await expect(page.getByRole('heading', { name: 'I am peaceful' })).toBeVisible();
  });

  test('a custom chant stays local and appears on the practice screen', async ({ page }) => {
    await page.goto('/chant');
    const customBox = page.getByLabel('Enter your own chant or prayer');
    await customBox.fill('My grandmother taught me this prayer');
    await page.getByRole('button', { name: 'Use This Text' }).click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();
    await expect(
      page.getByRole('heading', { name: 'My grandmother taught me this prayer' }),
    ).toBeVisible();
  });
});
