import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('Work Locations', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/locations');
  });

  test('should display locations list', async ({ page }) => {
    await expect(page.locator('[data-tour="location-list"]')).toBeVisible();
  });

  test('should show at least one location', async ({ page }) => {
    const list = page.locator('[data-tour="location-list"]');
    const items = list.locator('[class*="card"], li, tr').first();
    await expect(items).toBeVisible();
  });

  test('should display add location button', async ({ page }) => {
    await expect(page.locator('[data-tour="add-location"]')).toBeVisible();
  });

  test('should open add location modal', async ({ page }) => {
    await page.locator('[data-tour="add-location"]').click();

    // Form fields should appear
    await expect(page.locator('input[name="name"], input[placeholder*="ชื่อ"], input[placeholder*="name" i]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display location map', async ({ page }) => {
    await expect(page.locator('[data-tour="location-map"]')).toBeVisible();
  });

  test('should close add location modal', async ({ page }) => {
    await page.locator('[data-tour="add-location"]').click();
    await page.waitForTimeout(500);

    // Close via button or Escape
    const closeBtn = page.locator('button[aria-label*="close" i], button[aria-label*="ปิด"], button:has([class*="X"])').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.waitForTimeout(400);
    // Modal should be gone
    await expect(page.locator('input[name="name"]')).not.toBeVisible();
  });
});
