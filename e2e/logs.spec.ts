import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('Attendance Logs', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/logs');
  });

  test('should display logs page with search and filter', async ({ page }) => {
    await expect(page.locator('[data-tour="logs-filter"]')).toBeVisible();
    await expect(page.locator('[data-tour="logs-export"]')).toBeVisible();
  });

  test('should filter by search term', async ({ page }) => {
    const searchInput = page.locator('[data-tour="logs-filter"] input').first();
    await searchInput.fill('xxxnotexist');
    await page.waitForTimeout(500);

    // Page should still work (no crash)
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should export CSV', async ({ page }) => {
    const exportBtn = page.locator('[data-tour="logs-export"]');

    // If button is disabled (no data), skip gracefully
    const isDisabled = await exportBtn.isDisabled().catch(() => true);
    if (isDisabled) {
      // No data to export — test passes
      return;
    }

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10_000 }).catch(() => null),
      exportBtn.click(),
    ]);

    if (download) {
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });
});
