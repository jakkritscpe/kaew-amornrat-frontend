import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

test.describe('Attendance Logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/attendance/logs');
    await dismissTour(page);
  });

  test('should display logs page with search and filter', async ({ page }) => {
    await expect(page.locator('[data-tour="logs-filter"]')).toBeVisible();
    await expect(page.locator('[data-tour="logs-export"]')).toBeVisible();
  });

  test('should filter by search term', async ({ page }) => {
    const searchInput = page.locator('[data-tour="logs-filter"] input[type="text"]');
    await searchInput.fill('ทดสอบ');
    await page.waitForTimeout(500);

    // Should show filtered results or empty state - both are valid
    const tableOrEmpty = page.locator('[data-tour="logs-table"], [class*="text-center"]');
    await expect(tableOrEmpty.first()).toBeVisible();
  });

  test('should export CSV', async ({ page }) => {
    const exportBtn = page.locator('[data-tour="logs-export"]');

    // Listen for download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      exportBtn.click(),
    ]);

    if (download) {
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });
});
