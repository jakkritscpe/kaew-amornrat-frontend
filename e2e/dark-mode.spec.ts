import { test, expect } from '@playwright/test';
import { gotoAdmin, dismissTour } from './helpers';

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/attendance/dashboard');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.removeItem('dashboard_theme'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissTour(page);
  });

  test('should toggle dark mode via header button', async ({ page }) => {
    const themeBtn = page.locator('[data-tour="theme-toggle"]');

    await themeBtn.click();
    await page.waitForTimeout(500);
    const val = await page.evaluate(() => localStorage.getItem('dashboard_theme'));
    expect(val).toBe('dark');

    await themeBtn.click();
    await page.waitForTimeout(500);
    const val2 = await page.evaluate(() => localStorage.getItem('dashboard_theme'));
    expect(val2).toBe('light');
  });

  test('should persist dark mode after navigation', async ({ page }) => {
    await page.locator('[data-tour="theme-toggle"]').click();
    await page.waitForTimeout(500);

    await page.goto('/admin/attendance/employees');
    await page.waitForLoadState('networkidle');
    await dismissTour(page);

    await expect(page.locator('.min-h-screen').first()).toHaveClass(/dark/);
  });

  test('should persist dark mode after reload', async ({ page }) => {
    await page.locator('[data-tour="theme-toggle"]').click();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissTour(page);

    await expect(page.locator('.min-h-screen').first()).toHaveClass(/dark/);
  });
});
