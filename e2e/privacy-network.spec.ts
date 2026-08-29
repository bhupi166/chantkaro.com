import { expect, test } from '@playwright/test';

test('no request ever carries the selected chant text, and no third-party analytics load', async ({
  page,
}) => {
  const requestBodies: string[] = [];
  const thirdPartyHosts = new Set<string>();

  page.on('request', (request) => {
    const postData = request.postData();
    if (postData) requestBodies.push(postData);
    const host = new URL(request.url()).host;
    if (host && !host.includes('127.0.0.1') && !host.includes('localhost')) {
      thirdPartyHosts.add(host);
    }
  });

  await page.goto('/chant');
  const secretPhrase = 'MyPrivateFamilyPrayerXYZ123';
  await page.getByLabel('Enter your own chant or prayer').fill(secretPhrase);
  await page.getByRole('button', { name: 'Use This Text' }).click();
  await page.getByRole('button', { name: 'Begin Practice' }).click();

  const tapButton = page.getByRole('button', { name: /tap to count/i });
  for (let i = 0; i < 3; i++) await tapButton.click();

  for (const body of requestBodies) {
    expect(body).not.toContain(secretPhrase);
  }

  // Only known, allowed hosts (Google Fonts) should ever be contacted —
  // no ad or analytics SDKs.
  for (const host of thirdPartyHosts) {
    expect(host, `unexpected third-party host: ${host}`).toMatch(
      /fonts\.(googleapis|gstatic)\.com$/,
    );
  }
});
