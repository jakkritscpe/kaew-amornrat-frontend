import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

test.describe('Admin Employees', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/attendance/employees');
    await dismissTour(page);
  });

  test('should display employee list', async ({ page }) => {
    // Should have at least 1 employee card
    await expect(page.locator('[data-tour="employee-card"]').first()).toBeVisible();
  });

  test('should search employees', async ({ page }) => {
    const search = page.locator('[data-tour="employee-search"] input');
    await search.fill('สมชาย');

    // Should filter results
    await expect(page.getByText('สมชาย').first()).toBeVisible();
  });

  test('should open add employee modal', async ({ page }) => {
    await page.locator('[data-tour="add-employee"]').click();

    // Modal should appear
    await expect(page.getByText(/เพิ่มพนักงานใหม่|Add New Employee/i)).toBeVisible();
  });

  test('should open QR modal', async ({ page }) => {
    await page.locator('[data-tour="qr-button"]').click();

    // QR modal should appear
    await expect(page.getByText(/สแกนเพื่อเข้าสู่ระบบ|Scan to access/i)).toBeVisible();
  });
});
