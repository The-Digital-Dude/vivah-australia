import { test, expect } from '@playwright/test';

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
    await expect(page.locator('text=Pricing').first()).toBeVisible();
  });
});
