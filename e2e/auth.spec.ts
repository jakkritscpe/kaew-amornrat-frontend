import { test, expect } from '@playwright/test';
import { ADMIN, adminLogin } from './helpers';

test.describe('Admin Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await adminLogin(page);
    await expect(page).toHaveURL(/\/admin\/attendance\/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#admin-email').fill('wrong@test.com');
    await page.locator('#admin-password').fill('wrongpassword');
    await page.getByRole('button', { name: /เข้าสู่ระบบ|login/i }).click();

    // Should stay on login page with error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[class*="red"]').first()).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/admin/attendance/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    await adminLogin(page);

    // Click logout in sidebar
    await page.getByRole('button', { name: /ออกจากระบบ|logout/i }).click();
    await expect(page).toHaveURL('/');
  });
});
