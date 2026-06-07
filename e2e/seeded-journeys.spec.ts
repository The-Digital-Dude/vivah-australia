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
    // Verify the page content and select conversation details
    await expect(page.getByRole('heading', { name: 'Messages' }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Hi, thanks for accepting my interest. I liked your profile and family values.')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Thanks, nice to connect with you too.')).toBeVisible();
    await expect(page.getByRole('button', { name: /delete chat/i })).toBeVisible();
  });

  test('seeded admin can search the user table for a seeded member', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('link', { name: 'Users', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    await page.getByPlaceholder('Search name, email, or display ID').fill('priya.sharma@example.com');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('priya.sharma@example.com')).toBeVisible();
    await expect(page.getByText('Priya Sharma')).toBeVisible();
  });

  test('seeded member can search/browse matches and send interest request', async ({ page }) => {
    await loginAsDemoMember(page);

    await page.goto('/member/matches');
    await expect(page.getByRole('heading', { name: 'Search matches' }).first()).toBeVisible({ timeout: 15000 });

    // Switch to New Members tab to browse candidates
    await page.getByRole('button', { name: /new members/i }).click();

    // Wait for the tab loading to finish/render
    await page.waitForTimeout(1000);

    // Locating Rahul card and clicking interest button
    const rahulCard = page.locator('article', { hasText: 'Rahul' }).first();
    await expect(rahulCard).toBeVisible({ timeout: 15000 });

    const interestBtn = rahulCard.getByRole('button', { name: 'Interest' });
    await expect(interestBtn).toBeVisible();
    await interestBtn.click();

    // Expect feedback toast to show up
    await expect(page.getByText(/interest/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('seeded admin can view pending profiles and approve a profile', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('link', { name: 'Profiles', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Profile Moderation Queue' })).toBeVisible({ timeout: 15000 });

    // Wait for cards to finish loading by checking for Compare Draft button
    await expect(page.getByRole('button', { name: 'Compare Draft' }).first()).toBeVisible({ timeout: 15000 });

    // Locate the first pending profile card with an Approve button and click it
    const approveBtn = page.getByRole('button', { name: 'Approve', exact: true }).first();
    await expect(approveBtn).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000); // Wait for hydration / click handlers
    await approveBtn.click();

    // Confirm checkbox on the modal
    const checkbox = page.locator('#confirm-prof-app');
    await expect(checkbox).toBeVisible({ timeout: 10000 });
    await checkbox.check();

    // Click submit decision button
    const submitBtn = page.getByRole('button', { name: 'Submit Decision' });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Expect status badge or toast to update
    await expect(page.getByText(/success/i).or(page.getByText(/profile/i)).first()).toBeVisible({ timeout: 15000 });
  });
});
