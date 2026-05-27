import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthRegister from '../components/AuthRegister';

vi.mock('../api/api', () => ({
  register: vi.fn(),
  saveAuthSession: vi.fn(),
}));

import * as api from '../api/api';

function renderComponent() {
  return render(
    <MemoryRouter>
      <AuthRegister />
    </MemoryRouter>
  );
}

describe('UI-01 — Форма регистрации: наличие всех полей и кнопки', () => {
  it('отображает поля Имя, Фамилия, Email, Пароль и кнопку «Создать аккаунт»', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('Иван')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Иванов')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Придумайте пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /создать аккаунт/i })).toBeInTheDocument();
  });
});

describe('UI-02 — Кнопка показать/скрыть пароль', () => {
  it('переключает тип поля пароля между password и text', async () => {
    renderComponent();
    const passwordInput = screen.getByPlaceholderText('Придумайте пароль');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /показать пароль/i });
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: /скрыть пароль/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('UI-03 — Ошибка при регистрации с занятым email', () => {
  beforeEach(() => {
    vi.mocked(api.register).mockRejectedValue(new Error('User with this email already exists.'));
  });

  it('показывает блок с текстом ошибки после неудачной регистрации', async () => {
    renderComponent();

    await userEvent.type(screen.getByPlaceholderText('Иван'), 'Иван');
    await userEvent.type(screen.getByPlaceholderText('Иванов'), 'Иванов');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'existing@test.com');
    await userEvent.type(screen.getByPlaceholderText('Придумайте пароль'), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /создать аккаунт/i }));

    await waitFor(() => {
      expect(screen.getByText(/user with this email already exists/i)).toBeInTheDocument();
    });
  });
});
