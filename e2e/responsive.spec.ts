import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

// These tests only run in mobile project
test.describe('Responsive - Mobile', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) > 500, 'Mobile only');
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test('should show hamburger menu on mobile', async ({ page }) => {
    await adminLogin(page);
    await dismissTour(page);

    // Sidebar should be hidden
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveCSS('transform', /translateX\(-/);

    // Hamburger button should be visible
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
  });

  test('should open mobile sidebar', async ({ page }) => {
    await adminLogin(page);
    await dismissTour(page);

    // Click hamburger
    await page.locator('button[aria-label="Menu"]').click();

    // Sidebar should be visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('landing page should show language switcher on mobile', async ({ page }) => {
    await page.goto('/');

    // Language switcher should be visible next to hamburger
    await expect(page.locator('button:has-text("TH")').first()).toBeVisible();
  });
});
