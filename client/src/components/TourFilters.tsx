// src/components/TourFilters.tsx
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react'; // если lucide-react установлен

interface TourFiltersProps {
  onFilterChange: (filters: {
    search: string;
    minPrice: number;
    maxPrice: number;
  }) => void;
}

export default function TourFilters({ onFilterChange }: TourFiltersProps) {
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Debounce-like: передаём изменения родителю только когда удобно
  useMemo(() => {
    onFilterChange({
      search: search.trim().toLowerCase(),
      minPrice: typeof minPrice === 'number' ? minPrice : 0,
      maxPrice: typeof maxPrice === 'number' ? maxPrice : Infinity,
    });
  }, [search, minPrice, maxPrice, onFilterChange]);

  const resetFilters = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="mb-10 md:mb-12">
      <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-md md:flex-row md:items-end md:gap-8">
        {/* Поиск по названию */}
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Направление или страна
          </label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Бали, Мальдивы, Турция..."
              className="
                w-full rounded-lg border border-gray-300 px-4 py-3 pl-11
                focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none
              "
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Цена от */}
        <div className="w-full md:w-44">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Цена от (₽)
          </label>
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
            placeholder="0"
            className="
              w-full rounded-lg border border-gray-300 px-4 py-3
              focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none
            "
          />
        </div>

        {/* Цена до */}
        <div className="w-full md:w-44">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Цена до (₽)
          </label>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
            placeholder="∞"
            className="
              w-full rounded-lg border border-gray-300 px-4 py-3
              focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none
            "
          />
        </div>

        {/* Кнопки */}
        <div className="flex items-end gap-3 self-end">
          <button
            onClick={resetFilters}
            className="
              flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3
              text-gray-700 hover:bg-gray-50 active:bg-gray-100
            "
          >
            <X size={18} /> Сброс
          </button>
        </div>
      </div>
    </div>
  );
}