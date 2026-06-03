import { expect, test } from '@playwright/test';

async function loginAsDemoMember(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill('priya.sharma@example.com');
  await page.locator('input[name="password"]').fill('TestUserStrong123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/member$/, { timeout: 15000 });
}

async function loginAsAdmin(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/admin/login');
  await page.locator('input[name="email"]').fill('manager@vivahaustralia.com');
  await page.locator('input[name="password"]').fill('ChangeMeStrong123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/, { timeout: 15000 });
}

test.describe('Vivah Australia Seeded Browser Journeys', () => {
  test('seeded member can open a real conversation and see seeded message history', async ({
    page,
  }) => {
    await loginAsDemoMember(page);

    await page.goto('/member/messages');
    await expect(page.getByRole('heading', { name: 'Conversations' })).toBeVisible();
    await expect(page.getByText('Hi, thanks for accepting my interest. I liked your profile and family values.')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Thanks, nice to connect with you too.')).toBeVisible();
    await expect(page.getByRole('button', { name: /delete chat/i })).toBeVisible();
  });

  test('seeded admin can search the user table for a seeded member', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    await page.getByPlaceholder('Search name, email, or display ID').fill('priya.sharma@example.com');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('priya.sharma@example.com')).toBeVisible();
    await expect(page.getByText('Priya Sharma')).toBeVisible();
  });
});
