import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/attendance/reports');
    await dismissTour(page);
  });

  test('should display report page with mode toggle', async ({ page }) => {
    await expect(page.locator('[data-tour="report-mode-toggle"]')).toBeVisible();
    await expect(page.locator('[data-tour="report-month-nav"]')).toBeVisible();
  });

  test('should toggle between late and on-time mode', async ({ page }) => {
    const toggle = page.locator('[data-tour="report-mode-toggle"]');

    // Click "ตรงเวลา" button
    await toggle.getByText(/ตรงเวลา|On Time/i).click();

    // Table title should change
    await expect(page.getByText(/ตรงเวลา|On.Time/i).first()).toBeVisible();

    // Click "มาสาย" button
    await toggle.getByText(/มาสาย|Late/i).click();
    await expect(page.getByText(/มาสาย|Late/i).first()).toBeVisible();
  });

  test('should navigate months', async ({ page }) => {
    const nav = page.locator('[data-tour="report-month-nav"]');

    // Get current displayed text inside the nav
    const monthText = await nav.textContent();

    // Click prev button (first button in nav)
    await nav.locator('button').first().click();
    await page.waitForTimeout(300);

    // Month text should have changed
    const newMonthText = await nav.textContent();
    expect(newMonthText).not.toBe(monthText);
  });
});
