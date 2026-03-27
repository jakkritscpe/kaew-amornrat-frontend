import { test as setup } from '@playwright/test';
import { ADMIN, dismissTour } from './helpers';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#admin-email').fill(ADMIN.email);
  await page.locator('#admin-password').fill(ADMIN.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|login/i }).click();
  await page.waitForURL('**/admin/**', { timeout: 30_000 });

  await dismissTour(page);

  // Save authenticated state
  await page.context().storageState({ path: './e2e/.auth/admin.json' });
});
