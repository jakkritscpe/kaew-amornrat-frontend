import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Reset dark mode
    await page.goto('/admin/attendance/dashboard');
    await page.evaluate(() => localStorage.removeItem('dashboard_theme'));
    await page.reload();
    await dismissTour(page);
  });

  test('should toggle dark mode via header button', async ({ page }) => {
    const themeBtn = page.locator('[data-tour="theme-toggle"]');

    // Enable dark mode
    await themeBtn.click();
    await page.waitForTimeout(400);

    // Should have 'dark' class
    await expect(page.locator('.min-h-screen').first()).toHaveClass(/dark/);

    // Disable dark mode
    await themeBtn.click();
    await page.waitForTimeout(400);
    await expect(page.locator('.min-h-screen').first()).not.toHaveClass(/dark/);
  });

  test('should persist dark mode after navigation', async ({ page }) => {
    await page.locator('[data-tour="theme-toggle"]').click();
    await page.waitForTimeout(400);
    await page.goto('/admin/attendance/employees');
    await dismissTour(page);

    await expect(page.locator('.min-h-screen').first()).toHaveClass(/dark/);
  });

  test('should persist dark mode after reload', async ({ page }) => {
    await page.locator('[data-tour="theme-toggle"]').click();
    await page.waitForTimeout(400);
    await page.reload();
    await dismissTour(page);

    await expect(page.locator('.min-h-screen').first()).toHaveClass(/dark/);
  });
});
