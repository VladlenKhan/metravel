import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import TourBookingAction from '../components/TourBookingAction';
import type { AuthSession, Tour } from '../api/api';

const mockTour: Tour = {
  id: 'tour-1',
  title: 'Тур в Турцию',
  city: 'Анталья',
  country: 'Турция',
  startDate: '2026-07-01',
  endDate: '2026-07-14',
  basePrice: 85000,
  totalSeats: 20,
  availableSeats: 5,
};

const mockSession: AuthSession = {
  token: 'jwt-token',
  fullName: 'Иван Иванов',
  email: 'ivan@example.com',
  role: 'Client',
};

function renderAction(overrides: Partial<Parameters<typeof TourBookingAction>[0]> = {}) {
  const props = {
    tour: mockTour,
    session: mockSession,
    profileLoading: false,
    profileComplete: true,
    profileError: null,
    bookingTourId: null,
    bookingLockLabel: null,
    onBook: vi.fn(),
    ...overrides,
  };
  return render(
    <MemoryRouter>
      <TourBookingAction {...props} />
    </MemoryRouter>
  );
}

describe('UI-07 — Кнопка «Войти для бронирования» для неавторизованного пользователя', () => {
  it('показывает ссылку «Войти для бронирования» когда сессия отсутствует', () => {
    renderAction({ session: null });
    expect(screen.getByRole('link', { name: /войти для бронирования/i })).toBeInTheDocument();
  });
});

describe('UI-08 — Сообщение для администраторов и операторов', () => {
  it('показывает текст о недоступности бронирования для роли Admin', () => {
    renderAction({ session: { ...mockSession, role: 'Admin' } });
    expect(screen.getByText(/бронирование из каталога доступно для клиентов/i)).toBeInTheDocument();
  });
});

describe('UI-09 — Кнопка «Заполнить профиль» при незаполненном профиле', () => {
  it('показывает кнопку «Заполнить профиль» и подсказку о необходимых данных', () => {
    renderAction({ profileComplete: false });

    expect(screen.getByRole('link', { name: /заполнить профиль/i })).toBeInTheDocument();
    expect(screen.getByText(/телефон и паспортные данные/i)).toBeInTheDocument();
  });
});

describe('UI-10 — Кнопка «Забронировать» для клиента с заполненным профилем', () => {
  it('показывает активную кнопку «Забронировать» при наличии свободных мест', () => {
    renderAction();
    const btn = screen.getByRole('button', { name: /забронировать/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });
});

describe('UI-11 — Кнопка «Мест нет» при availableSeats = 0', () => {
  it('показывает задизейбленную кнопку «Мест нет»', () => {
    renderAction({ tour: { ...mockTour, availableSeats: 0 } });
    const btn = screen.getByRole('button', { name: /мест нет/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });
});
