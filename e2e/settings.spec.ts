import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'settings');
  });

  test('should display settings page with tabs', async ({ page }) => {
    await expect(page.locator('[data-tour="settings-tabs"]')).toBeVisible();
  });

  test('should display RBAC tab', async ({ page }) => {
    await page.locator('[data-tour="settings-tabs"]').getByText(/สิทธิ์|Permission|RBAC/i).click();
    await expect(page.locator('[data-tour="settings-rbac"]')).toBeVisible();
  });

  test('should display accounts tab', async ({ page }) => {
    await page.locator('[data-tour="settings-tabs"]').getByText(/บัญชี|Account/i).click();
    await expect(page.locator('[data-tour="settings-accounts"]')).toBeVisible();
  });

  test('should display compensation/OT rate tab', async ({ page }) => {
    const tabs = page.locator('[data-tour="settings-tabs"]');
    await tabs.getByText(/ค่าตอบแทน|Compensation|OT Rate/i).click();

    // OT rate fields should be visible
    await expect(page.locator('input[type="number"], input[type="radio"]').first()).toBeVisible();
  });

  test('should show current OT rate value', async ({ page }) => {
    const tabs = page.locator('[data-tour="settings-tabs"]');
    await tabs.getByText(/ค่าตอบแทน|Compensation|OT Rate/i).click();

    // Rate value input should have a value
    const rateInput = page.locator('input[type="number"]').first();
    await expect(rateInput).toBeVisible();
    const val = await rateInput.inputValue();
    expect(Number(val)).toBeGreaterThan(0);
  });

  test('should list admin accounts', async ({ page }) => {
    const tabs = page.locator('[data-tour="settings-tabs"]');
    await tabs.getByText(/บัญชี|Account/i).click();
    await expect(page.locator('[data-tour="settings-accounts"]')).toBeVisible();

    // At least 1 admin account should exist
    const rows = page.locator('[data-tour="settings-accounts"] tr, [data-tour="settings-accounts"] [class*="card"]');
    expect(await rows.count()).toBeGreaterThan(0);
  });
});
