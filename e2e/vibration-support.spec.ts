import { expect, test } from '@playwright/test';

test('the Vibration on tap setting is only offered on devices that actually support it', async ({
  page,
  browserName,
}) => {
  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: 'Vibration on tap' });

  // WebKit (real Safari engine, used for the "Mobile iOS" project) has
  // never implemented the Vibration API — showing a toggle that can never
  // do anything is what prompted this fix (see usePracticeCounter.ts /
  // lib/vibration.ts).
  if (browserName === 'webkit') {
    await expect(toggle).toHaveCount(0);
  } else {
    await expect(toggle).toBeVisible();
  }
});
