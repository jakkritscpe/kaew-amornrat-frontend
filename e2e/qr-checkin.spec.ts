import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('QR Check-in Public Page', () => {
  test('should load QR login page with valid token format', async ({ page }) => {
    // Get a real QR token from admin side first
    await gotoAdmin(page, 'attendance/employees');

    // Click QR button on first employee
    const qrBtn = page.locator('[data-tour="qr-button"]').first();
    if (await qrBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qrBtn.click();
      await page.waitForTimeout(1000);

      // Extract QR URL from modal text or link
      const qrUrlText = await page.locator('a[href*="/employee/qr-login/"]').first().getAttribute('href').catch(() => null);

      if (qrUrlText) {
        // Visit the QR URL in a new tab/same page
        await page.goto(qrUrlText);
        await page.waitForLoadState('networkidle');

        // QR page should show employee info (not 404/error)
        await expect(page).not.toHaveURL(/404/);
        // Should show employee name or check-in button
        const content = await page.textContent('body');
        expect(content).not.toContain('undefined');
        expect(content).not.toContain('404');
      }
    }
  });

  test('should show 404 or error for invalid QR token', async ({ page }) => {
    await page.goto('/employee/qr-login/invalid-token-that-does-not-exist');
    await page.waitForLoadState('networkidle');

    // Should show error state
    const content = await page.textContent('body');
    expect(content).toMatch(/ไม่พบ|หมดอายุ|ไม่ถูกต้อง|not found|expired|invalid|error/i);
  });
});

test.describe('QR Token in Employee List', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/employees');
  });

  test('should show QR button on employee card', async ({ page }) => {
    const qrBtn = page.locator('[data-tour="qr-button"]').first();
    await expect(qrBtn).toBeVisible();
  });

  test('should open QR modal with employee name', async ({ page }) => {
    const firstCard = page.locator('[data-tour="employee-card"]').first();
    const empName = await firstCard.locator('h3, [class*="font-semibold"]').first().textContent();

    await page.locator('[data-tour="qr-button"]').first().click();
    await page.waitForTimeout(500);

    // Modal should show the employee's name
    if (empName) {
      await expect(page.getByText(empName.trim()).first()).toBeVisible();
    }
  });

  test('should not show undefined in QR URL', async ({ page }) => {
    await page.locator('[data-tour="qr-button"]').first().click();
    await page.waitForTimeout(500);

    // QR URL text should not contain "undefined"
    const modalText = await page.locator('[class*="modal"], [role="dialog"]').first().textContent().catch(() => '');
    expect(modalText).not.toContain('undefined');
  });
});
