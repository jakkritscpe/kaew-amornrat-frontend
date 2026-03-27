import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

// Uses saved admin session from mobile project (no manual login needed)

test.describe('Responsive - Mobile', () => {

  test('should show hamburger menu on mobile', async ({ page }) => {
    await gotoAdmin(page, 'attendance/dashboard');
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
  });

  test('should open mobile sidebar', async ({ page }) => {
    await gotoAdmin(page, 'attendance/dashboard');

    await page.locator('button[aria-label="Menu"]').click();
    await page.waitForTimeout(500);

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('landing page should show language switcher on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Language buttons may be TH or EN — just verify at least one is present
    const langBtn = page.locator('button').filter({ hasText: /^(TH|EN)$/ }).first();
    await expect(langBtn).toBeVisible({ timeout: 10_000 });
  });
});
