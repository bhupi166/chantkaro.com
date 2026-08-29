import { expect, test } from '@playwright/test';

test('Tap Mode keeps counting while the network is offline', async ({ page, context }) => {
  await page.goto('/chant');
  await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
  await page.getByRole('button', { name: 'Begin Practice' }).click();

  const tapButton = page.getByRole('button', { name: /tap to count/i });
  await tapButton.click();

  await context.setOffline(true);
  await expect(page.getByText(/you are offline/i)).toBeVisible();

  for (let i = 0; i < 4; i++) {
    await tapButton.click();
  }
  await expect(tapButton).toContainText('5');

  await context.setOffline(false);
});
