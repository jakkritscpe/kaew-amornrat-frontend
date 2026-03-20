import { test, expect } from '@playwright/test';
import { dismissTour } from './helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/attendance/dashboard');
    await dismissTour(page);
  });

  test('should display stat cards', async ({ page }) => {
    await expect(page.locator('[data-tour="stat-cards"]')).toBeVisible();
    // Should have 4 stat cards
    const cards = page.locator('[data-tour="stat-cards"] > *');
    await expect(cards).toHaveCount(4);
  });

  test('should display recent check-ins table', async ({ page }) => {
    await expect(page.locator('[data-tour="recent-checkins"]')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    const themeBtn = page.locator('[data-tour="theme-toggle"]');
    await themeBtn.click();

    // Background should change to dark
    const wrapper = page.locator('.min-h-screen').first();
    await expect(wrapper).toHaveClass(/bg-\[#0f172a\]/);

    // Toggle back
    await themeBtn.click();
    await expect(wrapper).toHaveClass(/bg-\[#f8fafc\]/);
  });

  test('should navigate to attendance logs', async ({ page }) => {
    await page.getByText(/ดูประวัติทั้งหมด|View All History/i).first().click();
    await expect(page).toHaveURL(/\/admin\/attendance\/logs/);
  });
});
