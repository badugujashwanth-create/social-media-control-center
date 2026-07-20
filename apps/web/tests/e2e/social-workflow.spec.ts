import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3100';
const outputDir = path.resolve(__dirname, '../../../../docs/audit/final');

test.beforeAll(() => fs.mkdirSync(outputDir, { recursive: true }));

async function assertNoPageOverflow(page: import('@playwright/test').Page) {
  const size = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth);
}

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('recruiter@example.com');
  await page.getByLabel('Password').fill('demo-pass-2026');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('real safe-demo workflow reaches deterministic per-provider results', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && !['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
  });

  await login(page);
  await expect(page.getByText('Safe demo workspace.')).toBeVisible();
  await expect(page.getByText('Connected Accounts').first()).toBeVisible();
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible();
  await assertNoPageOverflow(page);
  await page.screenshot({ path: path.join(outputDir, '03-dashboard-ready.png') });

  await page.getByRole('link', { name: 'Accounts' }).click();
  await expect(page.getByRole('heading', { name: 'Connected Accounts' })).toBeVisible();
  await expect(page.getByText('Northstar Studio')).toBeVisible();
  await expect(page.getByText('Simulated')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /unavailable in demo/ })).toHaveCount(3);
  await assertNoPageOverflow(page);
  await page.screenshot({ path: path.join(outputDir, '04-synthetic-accounts.png') });

  await page.getByRole('link', { name: 'Compose' }).click();
  await page.getByLabel('Post content').fill('Northstar release: safer cross-platform delivery with visible per-provider results.');
  await page.getByRole('textbox', { name: 'Link (optional)' }).fill('https://example.com/northstar-release');
  await expect(page.getByText(/^\d+\/5000$/)).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, '05-compose-ready.png') });
  await page.getByRole('button', { name: 'Post to All' }).click();

  await expect(page).toHaveURL(/\/posts\?postId=103$/);
  const latestPost = page.locator('main').locator('div.rounded-lg').filter({ hasText: 'Northstar release' }).first();
  await expect(latestPost).toContainText('publishing');
  await page.screenshot({ path: path.join(outputDir, '06-publishing-progress.png') });
  await expect(latestPost.getByText('success', { exact: true })).toHaveCount(3, { timeout: 7000 });
  await expect(latestPost).toContainText('demo_linkedin_103');
  await expect(latestPost).toContainText('demo_x_103');
  await expect(latestPost).toContainText('demo_facebook_103');
  await page.screenshot({ path: path.join(outputDir, '07-provider-results.png') });

  await page.getByRole('link', { name: 'Analytics' }).click();
  await page.waitForURL(/\/analytics$/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Follower Delta Series')).toBeVisible();
  await page.getByRole('button', { name: 'Capture follower snapshot' }).click();
  await expect(page.getByRole('button', { name: 'Capture follower snapshot' })).toBeEnabled();
  await page.screenshot({ path: path.join(outputDir, '08-analytics-boundaries.png') });

  const health = await page.request.get('http://127.0.0.1:8011/health');
  expect(await health.json()).toEqual({ status: 'ok', mode: 'synthetic-demo', providers_contacted: false });
  expect(externalRequests).toEqual([]);
});

test('mobile navigation, focus, and reduced motion remain usable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await login(page);
  await assertNoPageOverflow(page);
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.focus();
  await expect(menu).toBeFocused();
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, '09-mobile-navigation.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden();
  const reduced = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(reduced).toBe(true);
  await context.close();
});
