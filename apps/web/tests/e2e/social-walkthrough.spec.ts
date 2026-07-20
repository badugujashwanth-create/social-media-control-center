import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.DEMO_BASE_URL;
if (!baseUrl) throw new Error('Set DEMO_BASE_URL to the healthy local application URL.');

const repositoryRoot = path.resolve(__dirname, '../../../..');
const screenshotDirectory = path.join(repositoryRoot, 'docs', 'assets', 'screenshots', 'walkthrough');
fs.mkdirSync(screenshotDirectory, { recursive: true });

test.use({
  viewport: { width: 1280, height: 720 },
  video: { mode: 'on', size: { width: 1280, height: 720 } },
});

async function hold(page: Page, milliseconds: number) {
  if (process.env.DEMO_FAST === 'true') {
    await page.waitForTimeout(150);
    return;
  }
  const points = [[1080, 150], [980, 280], [1060, 450], [900, 600]] as const;
  const startedAt = Date.now();
  let index = 0;
  while (Date.now() - startedAt < milliseconds) {
    const [x, y] = points[index % points.length];
    await page.mouse.move(x, y, { steps: 18 });
    const remaining = milliseconds - (Date.now() - startedAt);
    await page.waitForTimeout(Math.min(5000, Math.max(0, remaining)));
    index += 1;
  }
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: path.join(screenshotDirectory, `${name}.png`), fullPage: false });
}

test('complete provider-isolated content workflow', async ({ page }) => {
  test.setTimeout(360_000);
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && !['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
  });

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await expect(page.getByText('Safe demo workspace.')).toBeVisible();
  await capture(page, '01-login-boundary');
  await hold(page, 20_000);

  await page.getByLabel('Email').fill('recruiter@example.com');
  await page.getByLabel('Password').fill('demo-pass-2026');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByText('Northstar Community')).toBeVisible();
  await capture(page, '02-dashboard-ready');
  await hold(page, 25_000);

  await page.getByRole('link', { name: 'Accounts' }).click();
  await expect(page.getByText('Simulated')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /unavailable in demo/ })).toHaveCount(3);
  await capture(page, '03-provider-boundaries');
  await hold(page, 30_000);

  await page.getByRole('link', { name: 'Compose' }).click();
  await expect(page.getByRole('heading', { name: 'Post Composer' })).toBeVisible();
  await capture(page, '04-composer-empty');
  await hold(page, 15_000);

  await page.getByLabel('Post content').fill('Northstar release: safer cross-platform delivery with visible per-provider results.');
  await page.getByRole('textbox', { name: 'Link (optional)' }).fill('https://example.com/northstar-release');
  await expect(page.getByText('linkedin - Northstar Studio')).toBeVisible();
  await capture(page, '05-composer-ready');
  await hold(page, 25_000);

  await page.getByRole('button', { name: 'Post to All' }).click();
  await expect(page).toHaveURL(/\/posts\/?\?postId=103$/);
  const current = page.locator('main').locator('div.rounded-lg').filter({ hasText: 'Northstar release' }).first();
  await expect(current.getByText('publishing', { exact: true })).toHaveCount(3);
  await capture(page, '06-publishing-progress');
  await hold(page, 15_000);

  await expect(current.getByText('success', { exact: true })).toHaveCount(3, { timeout: 7000 });
  await expect(current).toContainText('demo_linkedin_103');
  await expect(current).toContainText('demo_x_103');
  await expect(current).toContainText('demo_facebook_103');
  await capture(page, '07-provider-results');
  await hold(page, 30_000);

  const retryEvidence = page.locator('main').locator('div.rounded-lg').filter({ hasText: 'handles provider retries' }).first();
  await retryEvidence.scrollIntoViewIfNeeded();
  await expect(retryEvidence).toContainText('2');
  await capture(page, '08-retry-evidence');
  await hold(page, 20_000);

  await page.getByRole('link', { name: 'Analytics' }).click();
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Follower Delta Series')).toBeVisible();
  await capture(page, '09-analytics-snapshots');
  await hold(page, 35_000);

  await page.getByRole('button', { name: 'Capture follower snapshot' }).click();
  await expect(page.getByRole('button', { name: 'Capture follower snapshot' })).toBeEnabled();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await capture(page, '10-complete-workflow');
  await hold(page, 25_000);

  const health = await page.request.get('http://127.0.0.1:8011/health');
  expect(await health.json()).toEqual({ status: 'ok', mode: 'synthetic-demo', providers_contacted: false });
  expect(externalRequests).toEqual([]);
});
