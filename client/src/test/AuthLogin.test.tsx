import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthLogin from '../components/AuthLogin';

vi.mock('../api/api', () => ({
  login: vi.fn(),
  saveAuthSession: vi.fn(),
  fetchCurrentUser: vi.fn(),
  fetchClient: vi.fn(),
  isClientProfileComplete: vi.fn(),
  getAuthToken: vi.fn(() => null),
}));

import * as api from '../api/api';

function renderComponent(state?: object) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
      <AuthLogin />
    </MemoryRouter>
  );
}

describe('UI-04 — Форма входа: наличие всех элементов', () => {
  it('отображает поля Email и Пароль, кнопку «Войти» и ссылку на регистрацию', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });
});

describe('UI-05 — Кнопка показать/скрыть пароль на форме входа', () => {
  it('переключает тип поля пароля между password и text', async () => {
    renderComponent();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: /показать пароль/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: /скрыть пароль/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('UI-06 — Ошибка при входе с неверными данными', () => {
  beforeEach(() => {
    vi.mocked(api.login).mockRejectedValue(new Error('Invalid email or password.'));
  });

  it('показывает красный блок с сообщением об ошибке', async () => {
    renderComponent();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'wrong@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'badpassword');
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
});
