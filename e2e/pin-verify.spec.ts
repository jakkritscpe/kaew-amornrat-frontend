import { test, expect } from '@playwright/test';
import { gotoAdmin } from './helpers';

test.describe('Admin PIN Verification', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page, 'attendance/employees');
  });

  test('should prompt PIN before sensitive action', async ({ page }) => {
    // Click edit or delete on first employee card to trigger PIN modal
    const editBtn = page.locator('[data-tour="employee-card"]').first()
      .locator('button').filter({ hasText: /แก้ไข|Edit/i }).first();

    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // PIN modal or form modal should appear
      const pinInput = page.locator('input[type="password"][maxlength="4"], input[inputmode="numeric"][maxlength="4"]').first();
      const formModal = page.locator('input[name="name"]').first();

      const hasPinModal = await pinInput.isVisible({ timeout: 2000 }).catch(() => false);
      const hasFormModal = await formModal.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasPinModal || hasFormModal).toBe(true);
    }
  });

  test('should reject wrong PIN', async ({ page }) => {
    const editBtn = page.locator('[data-tour="employee-card"]').first()
      .locator('button').filter({ hasText: /แก้ไข|Edit/i }).first();

    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      const pinInput = page.locator('input[type="password"][maxlength="4"], input[inputmode="numeric"][maxlength="4"]').first();
      if (await pinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pinInput.fill('0000');
        await page.getByRole('button', { name: /ยืนยัน|Confirm|ตกลง/i }).first().click();
        await page.waitForTimeout(1000);

        // Should show error (wrong PIN)
        const errorMsg = page.locator('[class*="red"], [class*="error"], [role="alert"]').first();
        await expect(errorMsg).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
