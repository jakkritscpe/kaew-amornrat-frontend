import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('OT Approvals', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/ot-approvals');
  });

  test('should display OT filter tabs', async ({ page }) => {
    await expect(page.locator('[data-tour="ot-filter-tabs"]')).toBeVisible();

    await expect(page.getByText(/รออนุมัติ|Pending/i).first()).toBeVisible();
    await expect(page.getByText(/อนุมัติแล้ว|Approved/i).first()).toBeVisible();
  });

  test('should switch between filter tabs', async ({ page }) => {
    const tabs = page.locator('[data-tour="ot-filter-tabs"]');

    await tabs.getByText(/อนุมัติแล้ว|Approved/i).click();
    await page.waitForTimeout(500);

    await tabs.getByText(/ทั้งหมด|All/i).click();
    await page.waitForTimeout(500);

    await expect(page.locator('[data-tour="ot-request-list"]')).toBeVisible();
  });
});

test.describe('OT Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/ot-calculator');
  });

  test('should display period selector and stat cards', async ({ page }) => {
    await expect(page.locator('[data-tour="ot-period-selector"]')).toBeVisible();
    await expect(page.locator('[data-tour="ot-stat-cards"]')).toBeVisible();
  });

  test('should switch between monthly and custom mode', async ({ page }) => {
    const selector = page.locator('[data-tour="ot-period-selector"]');

    await selector.getByText(/กำหนดเอง|Custom/i).click();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });
});
