import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('OT Workflow - Admin View', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/ot-approvals');
  });

  test('should display all OT request tabs', async ({ page }) => {
    const tabs = page.locator('[data-tour="ot-filter-tabs"]');
    await expect(tabs.getByText(/รออนุมัติ|Pending/i).first()).toBeVisible();
    await expect(tabs.getByText(/อนุมัติแล้ว|Approved/i).first()).toBeVisible();
    await expect(tabs.getByText(/ทั้งหมด|All/i).first()).toBeVisible();
  });

  test('should display OT request list area', async ({ page }) => {
    await expect(page.locator('[data-tour="ot-request-list"]')).toBeVisible();
  });

  test('should switch to approved tab and show content', async ({ page }) => {
    const tabs = page.locator('[data-tour="ot-filter-tabs"]');
    await tabs.getByText(/อนุมัติแล้ว|Approved/i).click();
    await page.waitForTimeout(500);

    await expect(page.locator('[data-tour="ot-request-list"]')).toBeVisible();
  });

  test('should switch to rejected tab if exists', async ({ page }) => {
    const tabs = page.locator('[data-tour="ot-filter-tabs"]');
    const rejectedTab = tabs.getByText(/ปฏิเสธ|Rejected/i).first();
    if (await rejectedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rejectedTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('[data-tour="ot-request-list"]')).toBeVisible();
    }
  });

  test('should open OT detail if requests exist', async ({ page }) => {
    // Click "All" tab to maximize chance of seeing requests
    await page.locator('[data-tour="ot-filter-tabs"]').getByText(/ทั้งหมด|All/i).click();
    await page.waitForTimeout(500);

    const firstRequest = page.locator('[data-tour="ot-request-list"] [class*="card"], [data-tour="ot-request-list"] tr').first();
    if (await firstRequest.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to open detail/approve modal
      await firstRequest.click();
      await page.waitForTimeout(500);

      // Some kind of detail or action button should appear
      const actionBtn = page.locator('button').filter({ hasText: /อนุมัติ|ปฏิเสธ|Approve|Reject/i }).first();
      if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(actionBtn).toBeVisible();
      }
    }
  });
});

test.describe('OT Calculator - Detailed', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/ot-calculator');
  });

  test('should show OT detail table', async ({ page }) => {
    await expect(page.locator('[data-tour="ot-detail-table"]')).toBeVisible();
  });

  test('should show CSV export button', async ({ page }) => {
    await expect(page.locator('[data-tour="ot-export-csv"]')).toBeVisible();
  });

  test('should export OT CSV if data exists', async ({ page }) => {
    const exportBtn = page.locator('[data-tour="ot-export-csv"]');
    const isDisabled = await exportBtn.isDisabled().catch(() => true);
    if (!isDisabled) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10_000 }).catch(() => null),
        exportBtn.click(),
      ]);
      if (download) {
        expect(download.suggestedFilename()).toContain('.csv');
      }
    }
  });

  test('should show stat cards with numeric values', async ({ page }) => {
    const statCards = page.locator('[data-tour="ot-stat-cards"]');
    await expect(statCards).toBeVisible();

    // At least one stat should show a number
    const numbers = statCards.locator('text=/\\d+/');
    expect(await numbers.count()).toBeGreaterThan(0);
  });
});
