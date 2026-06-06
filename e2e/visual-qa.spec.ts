import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

test.describe('Visual QA & Regression Matrix', () => {
  for (const vp of viewports) {
    test.describe(`${vp.name} viewport (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('home page layout', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        // Verify core elements are visible and styled
        await expect(page.locator('text=Vivah Australia').first()).toBeVisible();
        await expect(page.locator('text=matrimonial').first()).toBeVisible();
        
        // Take responsive screenshot for visual validation
        await expect(page).toHaveScreenshot(`home-${vp.name}.png`, {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled',
        });
      });

      test('login page layout & social login buttons', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        
        // Verify credentials inputs are visible
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();

        // Verify social login buttons are visible
        await expect(page.locator('button:has-text("Google")').first()).toBeVisible();
        await expect(page.locator('button:has-text("Facebook")').first()).toBeVisible();

        // Take responsive screenshot for visual validation
        await expect(page).toHaveScreenshot(`login-${vp.name}.png`, {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled',
        });
      });

      test('matches preview layout', async ({ page }) => {
        await page.goto('/matches', { waitUntil: 'domcontentloaded' });
        
        // Verify core preview components
        await expect(page.locator('text=serious Australian matrimonial matches').first()).toBeVisible();
        await expect(page.getByRole('button', { name: /refresh preview/i })).toBeVisible();

        // Take responsive screenshot for visual validation
        await expect(page).toHaveScreenshot(`matches-preview-${vp.name}.png`, {
          maxDiffPixelRatio: 0.1,
          animations: 'disabled',
        });
      });
    });
  }
});
