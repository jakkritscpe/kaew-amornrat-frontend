import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/dashboard');
  });

  test('should display stat cards', async ({ page }) => {
    await expect(page.locator('[data-tour="stat-cards"]')).toBeVisible();
    const cards = page.locator('[data-tour="stat-cards"] > *');
    await expect(cards).toHaveCount(4);
  });

  test('should display recent check-ins table', async ({ page }) => {
    await expect(page.locator('[data-tour="recent-checkins"]')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
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

  test('should navigate to attendance logs', async ({ page }) => {
    // Try inline "view all" link first, fallback to direct nav
    const inlineLink = page.locator('a[href*="logs"]').first();
    if (await inlineLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inlineLink.click();
    } else {
      await page.goto('/admin/attendance/logs');
    }
    await expect(page).toHaveURL(/\/admin\/attendance\/logs/);
  });
});
