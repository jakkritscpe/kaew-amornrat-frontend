import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

test.describe('i18n Language Switching', () => {
  test('should switch language on landing page', async ({ page }) => {
    await page.goto('/');

    // Default should be Thai
    await expect(page.getByText('บริการไอทีมืออาชีพ')).toBeVisible();

    // Click EN button
    await page.locator('button:has-text("EN")').first().click();

    // Should show English
    await expect(page.getByText('Professional IT Services')).toBeVisible();

    // Click TH button
    await page.locator('button:has-text("TH")').first().click();

    // Should be back to Thai
    await expect(page.getByText('บริการไอทีมืออาชีพ')).toBeVisible();
  });

  test('should switch language on admin pages', async ({ page }) => {
    await page.goto('/admin/attendance/dashboard');
    await dismissTour(page);

    // Default Thai - check sidebar
    await expect(page.getByText('แดชบอร์ด').first()).toBeVisible();

    // Switch to EN via sidebar language switcher
    await page.locator('button:has-text("EN")').first().click();

    // Sidebar should show English
    await expect(page.getByText('Dashboard').first()).toBeVisible();
  });

  test('should persist language after page reload', async ({ page }) => {
    await page.goto('/');

    // Switch to EN
    await page.locator('button:has-text("EN")').first().click();
    await expect(page.getByText('Professional IT Services')).toBeVisible();

    // Reload
    await page.reload();

    // Should still be EN
    await expect(page.getByText('Professional IT Services')).toBeVisible();
  });
});
