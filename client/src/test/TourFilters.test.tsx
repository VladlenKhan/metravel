import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi, describe, it, expect } from 'vitest';
import TourFilters from '../components/TourFilters';
import type { TourFilterValues } from '../components/TourFilters';

const defaultFilters: TourFilterValues = {
  search: '',
  minPrice: 0,
  maxPrice: Infinity,
};

function StatefulFilters({ onChange = vi.fn(), initial = defaultFilters } = {}) {
  const [filters, setFilters] = useState(initial);
  const handleChange = (next: TourFilterValues) => {
    setFilters(next);
    onChange(next);
  };
  return <TourFilters filters={filters} onFilterChange={handleChange} />;
}

function renderFilters(initial = defaultFilters, onChange = vi.fn()) {
  return { onChange, ...render(<StatefulFilters onChange={onChange} initial={initial} />) };
}

describe('UI-12 — Фильтр туров: наличие полей и кнопки сброса', () => {
  it('отображает поле поиска, поля цены и кнопку «Сброс»', () => {
    renderFilters();

    expect(screen.getByPlaceholderText(/бали/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('∞')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сброс/i })).toBeInTheDocument();
  });
});

describe('UI-13 — Фильтр туров: ввод поискового запроса', () => {
  it('вызывает onFilterChange с обновлённым полем search при вводе текста', async () => {
    const { onChange } = renderFilters();

    await userEvent.type(screen.getByPlaceholderText(/бали/i), 'Турция');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Турция' })
    );
  });
});

describe('UI-14 — Фильтр туров: кнопка сброса', () => {
  it('вызывает onFilterChange с пустыми значениями при нажатии «Сброс»', async () => {
    const { onChange } = renderFilters({ search: 'Бали', minPrice: 50000, maxPrice: 100000 });

    await userEvent.click(screen.getByRole('button', { name: /сброс/i }));

    expect(onChange).toHaveBeenCalledWith({ search: '', minPrice: 0, maxPrice: Infinity });
  });
});
