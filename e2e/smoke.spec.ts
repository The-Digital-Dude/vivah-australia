import { test, expect } from '@playwright/test';

async function gotoApp(page: Parameters<typeof test>[0]['page'], path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function loginAsDemoMember(page: Parameters<typeof test>[0]['page']) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  const response = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
    data: {
      email: 'priya.sharma@example.com',
      password: 'TestUserStrong123!',
    },
  });

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };

  expect(payload.accessToken).toBeTruthy();
  expect(payload.refreshToken).toBeTruthy();

  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      window.localStorage.setItem('auth_token', accessToken);
      window.localStorage.setItem('refresh_token', refreshToken);
    },
    {
      accessToken: payload.accessToken!,
      refreshToken: payload.refreshToken!,
    },
  );
}

test.describe('Vivah Australia Smoke Tests', () => {
  test('should load the homepage and display brand title', async ({ page }) => {
    await gotoApp(page, '/');
    await expect(page).toHaveTitle(/Vivah Australia/);
    await expect(page.locator('text=Vivah Australia').first()).toBeVisible();
  });

  test('should load the login page and show credentials form', async ({ page }) => {
    await gotoApp(page, '/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should load pricing page and show plans', async ({ page }) => {
    await gotoApp(page, '/pricing');
    await expect(
      page.getByRole('heading', { name: 'Find Your Life Partner Faster' }),
    ).toBeVisible();
  });

  test('should load the public matches preview flow', async ({ page }) => {
    await gotoApp(page, '/matches');
    await expect(
      page.getByText('Explore a softer preview of serious Australian matrimonial matches').first(),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh preview/i })).toBeVisible();
  });

  test('should allow a seeded member to reach redesigned member matches and subscription pages', async ({
    page,
  }) => {
    await loginAsDemoMember(page);

    await gotoApp(page, '/member/matches');
    await expect(page).toHaveURL(/\/member\/matches$/);
    await expect(page.getByRole('heading', { name: /search matches/i })).toBeVisible();

    await gotoApp(page, '/member/subscription');
    await expect(page).toHaveURL(/\/member\/subscription$/);
    await expect(
      page.getByText('Choose the membership pace that fits your search'),
    ).toBeVisible();
  });
});
