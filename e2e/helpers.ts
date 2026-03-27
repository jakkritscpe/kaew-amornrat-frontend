import { type Page, expect } from '@playwright/test';

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@repair-hub.local',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'admin1234',
};
export const MANAGER = { email: 'manager@repair-hub.local', password: 'admin1234' };
export const EMPLOYEE = { email: 'somchai@repair-hub.local', password: 'emp1234' };

export async function adminLogin(page: Page, creds = ADMIN) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#admin-email').fill(creds.email);
  await page.locator('#admin-password').fill(creds.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ|login/i }).click();
  await page.waitForURL('**/admin/**', { timeout: 30_000 });
}

export async function dismissTour(page: Page) {
  // Close driver.js tour if it auto-starts — retry a few times for slow renders
  for (let i = 0; i < 3; i++) {
    const closeBtn = page.locator('.driver-popover-close-btn');
    if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }
}

/** Navigate to an admin page and wait for API data to load */
export async function gotoAdmin(page: Page, path: string) {
  await page.goto(`/admin/${path}`);
  await page.waitForLoadState('networkidle');
  await dismissTour(page);
}

export async function expectVisible(page: Page, text: string) {
  await expect(page.getByText(text).first()).toBeVisible();
}
