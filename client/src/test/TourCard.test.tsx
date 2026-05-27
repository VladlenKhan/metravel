import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import TourCard from '../components/TourCard';
import type { Tour } from '../api/api';

vi.mock('../components/TourServicesSummary', () => ({
  default: () => null,
}));

const baseTour: Tour = {
  id: 'tour-42',
  title: 'Солнечная Испания',
  city: 'Барселона',
  country: 'Испания',
  startDate: '2026-08-01',
  endDate: '2026-08-15',
  basePrice: 120000,
  totalSeats: 30,
  availableSeats: 10,
  description: 'Великолепный тур по Испании.',
};

describe('UI-20 — Карточка тура: отображение основных данных', () => {
  it('показывает название, страну, город и цену тура', () => {
    render(<TourCard tour={baseTour} />);

    expect(screen.getByText('Солнечная Испания')).toBeInTheDocument();
    expect(screen.getByText('Испания')).toBeInTheDocument();
    expect(screen.getByText('Барселона')).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
  });
});

describe('UI-21 — Карточка тура: статус наличия мест', () => {
  it('показывает «Можно бронировать» когда есть свободные места', () => {
    render(<TourCard tour={baseTour} />);
    expect(screen.getByText('Можно бронировать')).toBeInTheDocument();
  });

  it('показывает «Мест нет» когда availableSeats = 0', () => {
    render(<TourCard tour={{ ...baseTour, availableSeats: 0 }} />);
    expect(screen.getByText('Мест нет')).toBeInTheDocument();
  });
});

describe('UI-22 — Карточка тура: некорректные даты', () => {
  it('показывает «Даты уточняются» при пустых датах', () => {
    render(<TourCard tour={{ ...baseTour, startDate: '', endDate: '' }} />);
    expect(screen.getByText('Даты уточняются')).toBeInTheDocument();
  });
});

describe('UI-23 — Карточка тура: описание', () => {
  it('показывает описание тура если оно задано', () => {
    render(<TourCard tour={baseTour} />);
    expect(screen.getByText(/великолепный тур по испании/i)).toBeInTheDocument();
  });

  it('показывает заглушку если описание отсутствует', () => {
    render(<TourCard tour={{ ...baseTour, description: null }} />);
    expect(screen.getByText(/подробное описание скоро появится/i)).toBeInTheDocument();
  });
});
