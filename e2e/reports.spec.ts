import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/reports');
  });

  test('should display report page with mode toggle', async ({ page }) => {
    await expect(page.locator('[data-tour="report-mode-toggle"]')).toBeVisible();
    await expect(page.locator('[data-tour="report-month-nav"]')).toBeVisible();
  });

  test('should toggle between late and on-time mode', async ({ page }) => {
    const toggle = page.locator('[data-tour="report-mode-toggle"]');

    await toggle.getByText(/ตรงเวลา|On Time/i).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/ตรงเวลา|On.Time/i).first()).toBeVisible();

    await toggle.getByText(/มาสาย|Late/i).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/มาสาย|Late/i).first()).toBeVisible();
  });

  test('should navigate months', async ({ page }) => {
    const nav = page.locator('[data-tour="report-month-nav"]');
    const monthText = await nav.textContent();

    await nav.locator('button').first().click();
    await page.waitForTimeout(500);

    const newMonthText = await nav.textContent();
    expect(newMonthText).not.toBe(monthText);
  });
});
