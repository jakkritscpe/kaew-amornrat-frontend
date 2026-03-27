import { test, expect } from '@playwright/test';
import { ADMIN, adminLogin } from './helpers';

// Auth tests must NOT use saved session
test.use({ storageState: undefined });

test.describe('Admin Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await adminLogin(page);
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#admin-email').fill('wrong@test.com');
    await page.locator('#admin-password').fill('wrongpassword');
    await page.getByRole('button', { name: /เข้าสู่ระบบ|login/i }).click();

    // Should stay on login page with error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10_000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Use a fresh context without cookies — storageState: undefined ensures no auth_token cookie
    await page.goto('/admin/attendance/dashboard');
    // Should redirect to login (cookie-based auth — no cookie = redirect)
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10_000 });
  });

  test('should logout successfully', async ({ page }) => {
    await adminLogin(page);
    await page.waitForLoadState('networkidle');

    // Click logout — could be a button or a link with logout text/icon
    const logoutBtn = page.locator('button, a').filter({ hasText: /ออกจากระบบ|Logout/i }).first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
    } else {
      // Try sidebar bottom logout
      await page.locator('[data-tour="logout"], [aria-label*="logout" i], [aria-label*="ออกจากระบบ"]').first().click();
    }
    await expect(page).toHaveURL(/^\/$|\/login/, { timeout: 10_000 });
  });
});
