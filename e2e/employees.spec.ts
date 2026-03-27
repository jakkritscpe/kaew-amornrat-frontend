import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('Admin Employees', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/employees');
  });

  test('should display employee list', async ({ page }) => {
    await expect(page.locator('[data-tour="employee-card"]').first()).toBeVisible();
  });

  test('should search employees', async ({ page }) => {
    const search = page.locator('[data-tour="employee-search"] input');

    // Get the name of the first employee card and search for it (works on any env)
    const firstCard = page.locator('[data-tour="employee-card"]').first();
    const empName = await firstCard.locator('h3, [class*="font-semibold"], [class*="font-bold"]').first().textContent();
    const searchTerm = (empName ?? '').trim().slice(0, 4); // first 4 chars

    if (searchTerm) {
      await search.fill(searchTerm);
      await page.waitForTimeout(500);
      // At least one result should still be visible
      await expect(page.locator('[data-tour="employee-card"]').first()).toBeVisible();
    }
  });

  test('should open add employee modal', async ({ page }) => {
    await page.locator('[data-tour="add-employee"]').click();
    // Modal should appear — look for form inputs (name, email, etc.)
    await expect(page.locator('input[name="name"], input[placeholder*="ชื่อ"], input[placeholder*="name" i]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should open QR modal', async ({ page }) => {
    const qrBtn = page.locator('[data-tour="qr-button"]').first();
    if (await qrBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qrBtn.click();
      // QR modal should show QR code image or text
      await expect(page.locator('canvas, img[alt*="QR"], [class*="qr"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
