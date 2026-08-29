import { expect, test } from '@playwright/test';

test.describe('Cost control — global sync UI', () => {
  test('shows the exact required message when the server pauses global synchronization', async ({
    page,
  }) => {
    await page.route('**/api/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'cost-protection',
          batchThreshold: 1000,
          totalsRefreshSeconds: 750,
          submissionsPaused: true,
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/');
    await expect(
      page.getByText(
        'Your personal count is safe on this device. Global community synchronization is temporarily delayed to maintain reliable and sustainable service.',
      ),
    ).toBeVisible();
  });

  test('does not show the paused message under normal conditions', async ({ page }) => {
    await page.route('**/api/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'normal',
          batchThreshold: 100,
          totalsRefreshSeconds: 45,
          submissionsPaused: false,
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/');
    await expect(page.getByText(/temporarily delayed/i)).not.toBeVisible();
  });

  test('personal counting (Tap Mode) keeps working even when global sync is paused', async ({
    page,
  }) => {
    await page.route('**/api/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'cost-protection',
          batchThreshold: 1000,
          totalsRefreshSeconds: 750,
          submissionsPaused: true,
          updatedAt: new Date().toISOString(),
        }),
      });
    });
    // Even a real POST reaching the API in this state should never be relied
    // upon by the client — but assert the client doesn't even attempt it
    // for a small session, and that tapping still increments locally.
    let incrementCalls = 0;
    await page.route('**/api/increment', async (route) => {
      incrementCalls++;
      await route.fulfill({ status: 200, body: '{"ok":true}' });
    });

    await page.goto('/chant');
    await page.getByRole('button', { name: 'Om Namah Shivaya', exact: false }).first().click();
    await page.getByRole('button', { name: 'Begin Practice' }).click();

    const tapButton = page.getByRole('button', { name: /tap to count/i });
    for (let i = 0; i < 5; i++) await tapButton.click();
    await expect(tapButton).toContainText('5');

    expect(incrementCalls).toBe(0);
  });
});
