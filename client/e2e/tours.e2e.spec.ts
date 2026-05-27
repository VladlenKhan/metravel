import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// E2E-04: Список туров — публичная страница
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E2E-04: Страница туров', () => {
  test('страница /tours открывается без авторизации', async ({ page }) => {
    await page.goto('/tours');

    await expect(page).toHaveURL('/tours');

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });
});
