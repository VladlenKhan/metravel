import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// E2E-01: Регистрация нового пользователя
// ─────────────────────────────────────────────────────────────────────────────

const uniqueEmail = `e2e_${Date.now()}@test.com`;

test.describe('E2E-01: Регистрация пользователя', () => {
  test('успешная регистрация нового пользователя', async ({ page }) => {
    await page.goto('/register');

    await page.locator('input[autocomplete="given-name"]').fill('Тестовый');
    await page.locator('input[autocomplete="family-name"]').fill('Пользователь');
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill('TestPass123!');

    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    await expect(page).toHaveURL(/\/profile/, { timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E-02: Вход в систему
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E2E-02: Вход в систему', () => {
  test('успешный вход с правильными данными (admin)', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('admin@metravel.local');
    await page.locator('input[type="password"]').fill('admin123');

    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.getByText('System Admin').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E-03: Защита маршрутов
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E2E-03: Защита маршрутов', () => {
  test('неавторизованный пользователь перенаправляется на /login при открытии /favorites', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL(/\/login/);
  });
});
