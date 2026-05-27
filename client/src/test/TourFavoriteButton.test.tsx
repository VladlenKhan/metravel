import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import TourFavoriteButton from '../components/TourFavoriteButton';

describe('UI-15 — Кнопка избранного: неактивное состояние', () => {
  it('показывает aria-label «Добавить в желаемые туры» когда active=false', () => {
    render(<TourFavoriteButton active={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /добавить в желаемые туры/i })).toBeInTheDocument();
  });
});

describe('UI-16 — Кнопка избранного: активное состояние', () => {
  it('показывает aria-label «Убрать из желаемых туров» когда active=true', () => {
    render(<TourFavoriteButton active={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /убрать из желаемых туров/i })).toBeInTheDocument();
  });
});

describe('UI-17 — Кнопка избранного: нажатие вызывает onToggle', () => {
  it('вызывает onToggle при клике на кнопку', async () => {
    const onToggle = vi.fn();
    render(<TourFavoriteButton active={false} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: /добавить в желаемые туры/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
