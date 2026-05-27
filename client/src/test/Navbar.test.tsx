import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Navbar from '../components/Navbar';

vi.mock('../api/api', () => ({
  clearAuthSession: vi.fn(),
}));

vi.mock('../assets/images/metravel-logo.svg', () => ({ default: 'logo.svg' }));

vi.mock('../hooks/useAuthSession', () => ({
  useAuthSession: vi.fn(),
}));

vi.mock('../hooks/useFavoriteTours', () => ({
  useFavoriteTours: vi.fn(() => ({ favoriteCount: 0, isAvailable: false })),
}));

import { useAuthSession } from '../hooks/useAuthSession';

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe('UI-18 — Навбар: кнопки для неавторизованного пользователя', () => {
  it('показывает ссылки «Вход» и «Регистрация» когда пользователь не вошёл', () => {
    vi.mocked(useAuthSession).mockReturnValue(null);
    renderNavbar();

    expect(screen.getAllByRole('link', { name: /вход/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /регистрация/i }).length).toBeGreaterThan(0);
  });
});

describe('UI-19 — Навбар: имя пользователя после входа', () => {
  it('показывает имя пользователя когда сессия активна', () => {
    vi.mocked(useAuthSession).mockReturnValue({
      token: 'jwt',
      fullName: 'Иван Иванов',
      email: 'ivan@example.com',
      role: 'Client',
    });
    renderNavbar();

    expect(screen.getAllByText('Иван Иванов').length).toBeGreaterThan(0);
  });
});

describe('UI-20 — Навбар: основные ссылки навигации', () => {
  it('отображает ссылки «Туры» и «Главная»', () => {
    vi.mocked(useAuthSession).mockReturnValue(null);
    renderNavbar();

    expect(screen.getAllByRole('link', { name: /туры/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /главная/i }).length).toBeGreaterThan(0);
  });
});
