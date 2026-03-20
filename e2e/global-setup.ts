import { test as setup, expect } from '@playwright/test';
import { ADMIN } from './helpers';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#admin-email').fill(ADMIN.email);
  await page.locator('#admin-password').fill(ADMIN.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|login/i }).click();
  await page.waitForURL('**/admin/**');

  // Dismiss tour if it shows
  const closeBtn = page.locator('.driver-popover-close-btn');
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
  }

  // Save authenticated state
  await page.context().storageState({ path: './e2e/.auth/admin.json' });
});
