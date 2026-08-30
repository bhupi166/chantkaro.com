import { expect, test } from '@playwright/test';

test.describe('Timer Mode', () => {
  test('duration options replace the repetition target, and Begin Practice requires a duration', async ({
    page,
  }) => {
    await page.goto('/chant');
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();

    await expect(page.getByRole('button', { name: 'No target' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1 minute' })).not.toBeVisible();

    await page.getByRole('button', { name: 'Timer Mode' }).click();
    await expect(page.getByRole('button', { name: 'No target' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '1 minute' })).toBeVisible();

    // No duration chosen yet — Begin Practice must not be usable.
    await expect(page.getByRole('button', { name: 'Begin Practice' })).toBeDisabled();

    await page.getByRole('button', { name: '1 minute' }).click();
    await expect(page.getByRole('button', { name: 'Begin Practice' })).toBeEnabled();
  });

  test('a custom duration above 30 minutes is rejected with a clear message', async ({ page }) => {
    await page.goto('/chant');
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
    await page.getByRole('button', { name: 'Timer Mode' }).click();

    await page.getByRole('button', { name: 'Custom' }).click();
    await page.getByLabel('Minutes').fill('45');

    await expect(page.getByRole('alert')).toHaveText('Maximum duration is 30 minutes.');
    await expect(page.getByRole('button', { name: 'Begin Practice' })).toBeDisabled();
  });

  test('ready countdown, then the running timer shows only remaining time — no count, target or global total', async ({
    page,
  }) => {
    await page.goto('/chant');
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
    await page.getByRole('button', { name: 'Timer Mode' }).click();
    await page.getByRole('button', { name: '1 minute' }).click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();

    await expect(page.getByText('Get Ready')).toBeVisible();
    await expect(page.getByText('5', { exact: true })).toBeVisible();

    const runningTimer = page.getByRole('timer');
    await expect(runningTimer).toBeVisible({ timeout: 7000 }); // 5s ready countdown + margin
    await expect(runningTimer).toContainText('00:');

    // Nothing repetition/count-shaped should be present on this screen.
    await expect(page.getByRole('button', { name: /tap to count/i })).toHaveCount(0);
    await expect(page.getByText(/repetitions/i)).toHaveCount(0);

    // The chant name stays visible throughout.
    await expect(page.getByRole('heading', { name: 'Om Namah Shivaya' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  });

  test('Pause freezes the timer and Resume continues, Stop asks for confirmation', async ({
    page,
  }) => {
    await page.goto('/chant');
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
    await page.getByRole('button', { name: 'Timer Mode' }).click();
    await page.getByRole('button', { name: '1 minute' }).click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();

    const runningTimer = page.getByRole('timer');
    await expect(runningTimer).toBeVisible({ timeout: 7000 });

    await page.getByRole('button', { name: 'Pause' }).click();
    const pausedText = await runningTimer.textContent();
    await page.waitForTimeout(1500);
    await expect(runningTimer).toHaveText(pausedText ?? '');

    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    await page.getByRole('button', { name: 'Stop' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible(); // still running

    await page.getByRole('button', { name: 'Stop' }).click();
    await page.getByRole('button', { name: 'Stop Practice' }).click();
    await expect(page).toHaveURL('/');
  });
});
