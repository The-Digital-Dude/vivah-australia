import { test, expect, type Page } from '@playwright/test';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/**
 * Login via the API directly so the browser context receives the httpOnly
 * accessToken cookie — the same cookie that middleware.ts reads.
 * Does NOT rely on accessToken/refreshToken appearing in the response body
 * (they don't — the login route returns { user } and sets cookies only).
 */
async function apiLogin(page: Page, email: string, password: string) {
  const response = await page.request.post(`${apiBaseUrl}/api/auth/login`, {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
}

// Seeded credentials (see apps/api/src/db/seed.ts)
const MEMBER_EMAIL = 'priya.sharma@example.com';
const MEMBER_PASSWORD = 'TestUserStrong123!';
const ADMIN_EMAIL = 'admin@vivahaustralia.com';
const ADMIN_PASSWORD = 'ChangeMeStrong123!';

test.describe('middleware route protection', () => {
  test('unauthenticated access to /member redirects to /login with redirect param', async ({
    page,
  }) => {
    await page.goto('/member');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fmember/, { timeout: 10000 });
  });

  test('unauthenticated access to /admin redirects to /login with redirect param', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/, { timeout: 10000 });
  });

  test('unauthenticated access to a nested /member path redirects to /login', async ({ page }) => {
    await page.goto('/member/matches');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fmember%2Fmatches/, { timeout: 10000 });
  });

  test('/admin/login is publicly accessible (not caught by the matcher guard)', async ({
    page,
  }) => {
    await page.goto('/admin/login');
    // Should NOT redirect to /login — admin login page must remain public
    await expect(page).not.toHaveURL(/^.*\/login(?!\/)/, { timeout: 5000 });
  });

  test('authenticated MEMBER-role session can access /member routes', async ({ page }) => {
    await apiLogin(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    await page.goto('/member');
    // Should NOT redirect to /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/member/, { timeout: 10000 });
  });

  test('authenticated MEMBER-role session is redirected away from /admin (not to /login)', async ({
    page,
  }) => {
    await apiLogin(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    await page.goto('/admin');
    // Authenticated but not admin → redirect to / with message param, NOT to /login
    await expect(page).toHaveURL(/\/\?message=admin-access-required/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('authenticated ADMIN-role session can access /admin routes', async ({ page }) => {
    await apiLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
    // Should NOT redirect — admin role is allowed
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/admin-access-required/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('authenticated ADMIN-role session can also access /member routes', async ({ page }) => {
    await apiLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/member');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/member/, { timeout: 10000 });
  });

  test('expired accessToken cookie is treated as unauthenticated', async ({ page }) => {
    // Craft a JWT with an exp in the past (no real signature needed — middleware only decodes, doesn't verify)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const expiredPayload = btoa(
      JSON.stringify({
        sub: '000000000000000000000001',
        role: 'USER',
        type: 'access',
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 4500,
      }),
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const fakeSignature = 'fakesig';
    const expiredToken = `${header}.${expiredPayload}.${fakeSignature}`;

    await page.context().addCookies([
      {
        name: 'accessToken',
        value: expiredToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/member');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
