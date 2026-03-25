import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

// Uses saved admin session from mobile project (no manual login needed)

test.describe('Responsive - Mobile', () => {

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.goto('/admin/attendance/dashboard');
    await dismissTour(page);

    // Hamburger button should be visible
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
  });

  test('should open mobile sidebar', async ({ page }) => {
    await page.goto('/admin/attendance/dashboard');
    await dismissTour(page);

    // Click hamburger
    await page.locator('button[aria-label="Menu"]').click();
    await page.waitForTimeout(500);

    // Sidebar should be visible (translate-x-0)
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('landing page should show language switcher on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Language switcher TH button should be visible on mobile
    const thBtn = page.locator('button').filter({ hasText: 'TH' }).first();
    await expect(thBtn).toBeVisible({ timeout: 5000 });
  });
});
