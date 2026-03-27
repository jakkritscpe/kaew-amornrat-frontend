import { test, expect, type Page } from '@playwright/test';
import { dismissTour } from './helpers';

/** Opens sidebar on mobile if hamburger is visible, so lang switcher becomes accessible */
async function openSidebarIfMobile(page: Page) {
  const hamburger = page.locator('button[aria-label="Menu"]');
  if (await hamburger.isVisible({ timeout: 1500 }).catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(400);
  }
}

/** Find EN/TH button regardless of mobile sidebar state */
async function clickLangButton(page: Page, lang: 'EN' | 'TH') {
  await openSidebarIfMobile(page);
  await page.locator('button').filter({ hasText: lang }).first().click();
  await page.waitForTimeout(500);
}

test.describe('i18n Language Switching', () => {
  test('should switch language on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await clickLangButton(page, 'EN');
    const bodyEN = await page.textContent('body');
    expect(bodyEN).toMatch(/Services|Professional|Contact|About/i);

    await clickLangButton(page, 'TH');
    const bodyTH = await page.textContent('body');
    expect(bodyTH).toMatch(/บริการ|ติดต่อ|เกี่ยวกับ/);
  });

  test('should switch language on admin pages', async ({ page }) => {
    await page.goto('/admin/attendance/dashboard');
    await page.waitForLoadState('networkidle');
    await dismissTour(page);

    await clickLangButton(page, 'EN');
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();

    await clickLangButton(page, 'TH');
    await expect(page.getByText(/แดชบอร์ด/).first()).toBeVisible();
  });

  test('should persist language after page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await clickLangButton(page, 'EN');
    await page.reload();
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toMatch(/Services|Professional|Contact|About/i);
  });
});
