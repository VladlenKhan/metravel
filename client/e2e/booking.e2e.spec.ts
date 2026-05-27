import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательная функция: войти как admin
// ─────────────────────────────────────────────────────────────────────────────
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('admin@metravel.local');
  await page.locator('input[type="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/admin/, { timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// E2E-06: Полный сквозной сценарий "Просмотр туров после входа"
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E2E-06: Просмотр туров авторизованным пользователем', () => {
  test('после входа admin может открыть страницу туров', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/tours');

    await expect(page).toHaveURL('/tours');

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });
});
