import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

test.describe('OT Approvals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/attendance/ot-approvals');
    await dismissTour(page);
  });

  test('should display OT filter tabs', async ({ page }) => {
    await expect(page.locator('[data-tour="ot-filter-tabs"]')).toBeVisible();

    // Should have filter buttons
    await expect(page.getByText(/รออนุมัติ|Pending/i).first()).toBeVisible();
    await expect(page.getByText(/อนุมัติแล้ว|Approved/i).first()).toBeVisible();
  });

  test('should switch between filter tabs', async ({ page }) => {
    const tabs = page.locator('[data-tour="ot-filter-tabs"]');

    // Click "อนุมัติแล้ว"
    await tabs.getByText(/อนุมัติแล้ว|Approved/i).click();
    await page.waitForTimeout(300);

    // Click "ทั้งหมด"
    await tabs.getByText(/ทั้งหมด|All/i).click();
    await page.waitForTimeout(300);

    // Request list should be visible
    await expect(page.locator('[data-tour="ot-request-list"]')).toBeVisible();
  });
});

test.describe('OT Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/attendance/ot-calculator');
    await dismissTour(page);
  });

  test('should display period selector and stat cards', async ({ page }) => {
    await expect(page.locator('[data-tour="ot-period-selector"]')).toBeVisible();
    await expect(page.locator('[data-tour="ot-stat-cards"]')).toBeVisible();
  });

  test('should switch between monthly and custom mode', async ({ page }) => {
    const selector = page.locator('[data-tour="ot-period-selector"]');

    // Click custom mode
    await selector.getByText(/กำหนดเอง|Custom/i).click();

    // Date inputs should appear
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });
});
