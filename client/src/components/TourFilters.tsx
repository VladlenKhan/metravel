import { Search, X } from "lucide-react";
import {
  FIELD_LIMITS,
  FIELD_PATTERNS,
  FIELD_TITLES,
  sanitizeIntegerInput,
  sanitizeShortTextInput,
} from "../lib/formSanitizers";

export type TourFilterValues = {
  search: string;
  minPrice: number;
  maxPrice: number;
};

interface TourFiltersProps {
  filters: TourFilterValues;
  onFilterChange: (filters: TourFilterValues) => void;
}

export default function TourFilters({ filters, onFilterChange }: TourFiltersProps) {
  const updateFilters = (nextFilters: Partial<TourFilterValues>) => {
    onFilterChange({
      ...filters,
      ...nextFilters,
    });
  };

  const resetFilters = () => onFilterChange({ search: "", minPrice: 0, maxPrice: Infinity });

  return (
    <div className="mb-10 md:mb-12">
      <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-md md:flex-row md:items-end md:gap-8">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Направление или страна
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                updateFilters({
                  search: sanitizeShortTextInput(event.target.value, FIELD_LIMITS.search),
                })
              }
              placeholder="Бали, Мальдивы, Турция..."
              className="
                w-full rounded-lg border border-gray-300 px-4 py-3 pl-11
                focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none
              "
              maxLength={FIELD_LIMITS.search}
              pattern={FIELD_PATTERNS.text}
              title={FIELD_TITLES.text}
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="w-full md:w-44">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Цена от (₽)
          </label>
          <input
            type="text"
            value={filters.minPrice > 0 ? String(filters.minPrice) : ""}
            onChange={(event) =>
              updateFilters({
                minPrice: event.target.value
                  ? Number(
                      sanitizeIntegerInput(event.target.value, {
                        min: 0,
                        max: FIELD_LIMITS.price,
                      })
                    )
                  : 0,
              })
            }
            placeholder="0"
            className="
              w-full rounded-lg border border-gray-300 px-4 py-3
              focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none
            "
            maxLength={String(FIELD_LIMITS.price).length}
            pattern={FIELD_PATTERNS.digits}
            title={FIELD_TITLES.digits}
            inputMode="numeric"
          />
        </div>

        <div className="w-full md:w-44">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Цена до (₽)
          </label>
          <input
            type="text"
            value={Number.isFinite(filters.maxPrice) ? String(filters.maxPrice) : ""}
            onChange={(event) =>
              updateFilters({
                maxPrice: event.target.value
                  ? Number(
                      sanitizeIntegerInput(event.target.value, {
                        min: 0,
                        max: FIELD_LIMITS.price,
                      })
                    )
                  : Infinity,
              })
            }
            placeholder="∞"
            className="
              w-full rounded-lg border border-gray-300 px-4 py-3
              focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none
            "
            maxLength={String(FIELD_LIMITS.price).length}
            pattern={FIELD_PATTERNS.digits}
            title={FIELD_TITLES.digits}
            inputMode="numeric"
          />
        </div>

        <div className="flex items-end gap-3 self-end">
          <button
            type="button"
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
