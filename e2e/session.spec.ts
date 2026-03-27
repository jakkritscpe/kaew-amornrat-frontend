import { test, expect } from '@playwright/test';
import { gotoAdmin, dismissTour } from './helpers';

test.describe('Session Management', () => {
  test('should restore session after page reload', async ({ page }) => {
    await gotoAdmin(page, 'attendance/dashboard');

    // Reload and verify still authenticated
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissTour(page);

    // Should still be on admin page (not redirected to login)
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('[data-tour="stat-cards"]')).toBeVisible();
  });

  test('should restore session after navigating away and back', async ({ page }) => {
    await gotoAdmin(page, 'attendance/dashboard');

    // Navigate to home page then back
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/admin/attendance/dashboard');
    await page.waitForLoadState('networkidle');

    // Should be on admin page without re-login
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should have valid auth cookie', async ({ page }) => {
    await gotoAdmin(page, 'attendance/dashboard');

    // Verify auth_token cookie exists
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token');
    expect(authCookie).toBeTruthy();
    expect(authCookie?.httpOnly).toBe(true);
  });

});
