import { type Page, expect } from '@playwright/test';

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@repair-hub.local',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'admin1234',
};
export const MANAGER = { email: 'manager@repair-hub.local', password: 'admin1234' };
export const EMPLOYEE = { email: 'somchai@repair-hub.local', password: 'emp1234' };

export async function adminLogin(page: Page, creds = ADMIN) {
  await page.goto('/login');
  await page.locator('#admin-email').fill(creds.email);
  await page.locator('#admin-password').fill(creds.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|login/i }).click();
  await page.waitForURL('**/admin/**');
}

export async function dismissTour(page: Page) {
  // Close driver.js tour if it auto-starts
  const closeBtn = page.locator('.driver-popover-close-btn');
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
  }
}

export async function expectVisible(page: Page, text: string) {
  await expect(page.getByText(text).first()).toBeVisible();
}
