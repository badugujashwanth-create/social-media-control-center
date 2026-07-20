import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3100';
const phase = process.env.AUDIT_PHASE || 'current';
const outputDir = path.resolve(__dirname, '../../../../docs/audit', phase);

const accounts = [
  {
    id: 1,
    platform: 'linkedin',
    display_name: 'Northstar Studio',
    external_account_id: 'northstar-linkedin',
    expires_at: null,
    scopes: 'openid profile w_member_social',
    meta_json: { source: 'synthetic_audit' },
    capabilities: { supports_image: false, supports_link: true },
    updated_at: '2026-07-20T10:00:00Z',
    token_health: 'ok',
  },
  {
    id: 2,
    platform: 'x',
    display_name: 'Northstar Updates',
    external_account_id: 'northstar-x',
    expires_at: null,
    scopes: 'tweet.write users.read',
    meta_json: { source: 'synthetic_audit' },
    capabilities: { supports_image: false, supports_link: true },
    updated_at: '2026-07-20T10:00:00Z',
    token_health: 'ok',
  },
];

async function mockApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname.endsWith('/auth/login') || url.pathname.endsWith('/auth/signup')
      ? { access_token: 'synthetic-audit-token' }
      : url.pathname.endsWith('/dashboard')
        ? { accounts, recent_posts: [{ id: 10, text: 'Synthetic launch update', targets: [] }] }
        : url.pathname.endsWith('/accounts')
          ? accounts
          : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test.beforeAll(() => fs.mkdirSync(outputDir, { recursive: true }));

for (const project of [
  { name: 'desktop', viewport: { width: 1280, height: 720 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
]) {
  test(`${project.name} login and dashboard evidence`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: project.viewport });
    const page = await context.newPage();
    if (phase === 'current') await mockApi(page);

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Login|Welcome back/ })).toBeVisible();
    await page.screenshot({ path: path.join(outputDir, `01-login-${project.name}.png`) });

    await page.getByLabel('Email').fill('recruiter@example.com');
    await page.getByLabel('Password').fill('demo-pass-2026');
    await page.getByRole('button', { name: /Log in|Login/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await expect(page.getByRole('heading', { name: 'Unified Dashboard' })).toBeVisible();
    await expect(page.getByText('Northstar Studio')).toBeVisible();
    await page.waitForTimeout(5_000);
    await page.screenshot({ path: path.join(outputDir, `02-dashboard-${project.name}.png`) });

    const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    await context.close();
  });
}
