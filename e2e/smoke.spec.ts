import { test, expect } from '@playwright/test';

async function loginAsDemoMember(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('priya.sharma@example.com');
  await page.getByLabel('Password').fill('TestUserStrong123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/member$/);
}

test.describe('Vivah Australia Smoke Tests', () => {
  test('should load the homepage and display brand title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vivah Australia/);
    await expect(page.locator('text=Vivah Australia').first()).toBeVisible();
  });

  test('should load the login page and show credentials form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should load pricing page and show plans', async ({ page }) => {
    await page.goto('/pricing');
    await expect(
      page.getByText('Upgrade your search with verified contact access and priority visibility'),
    ).toBeVisible();
  });

  test('should load the public matches preview flow', async ({ page }) => {
    await page.goto('/matches');
    await expect(
      page.getByText('Explore a softer preview of serious Australian matrimonial matches'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh preview/i })).toBeVisible();
  });

  test('should allow a seeded member to reach redesigned member matches and subscription pages', async ({
    page,
  }) => {
    await loginAsDemoMember(page);

    await page.goto('/member/matches');
    await expect(
      page.getByText('Search with clarity, then go deeper only when needed'),
    ).toBeVisible();

    await page.goto('/member/subscription');
    await expect(
      page.getByText('Choose the membership pace that fits your search'),
    ).toBeVisible();
  });
});
