import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import TourCardActions from "../components/TourCardActions";
import TourCard from "../components/TourCard";
import TourFilters, { type TourFilterValues } from "../components/TourFilters";
import { useAuthSession } from "../hooks/useAuthSession";
import { useFavoriteTours } from "../hooks/useFavoriteTours";
import { useClientProfileStatus } from "../hooks/useClientProfileStatus";
import { useTourBooking } from "../hooks/useTourBooking";
import { useTours } from "../hooks/useTours";

export default function Tours() {
  const session = useAuthSession();
  const { tours, loading, error } = useTours();
  const { isFavorite, toggleFavorite, isAvailable: favoritesAvailable } = useFavoriteTours();
  const {
    loading: profileLoading,
    error: profileError,
    isComplete: profileComplete,
  } = useClientProfileStatus();
  const [filters, setFilters] = useState<TourFilterValues>({
    search: "",
    minPrice: 0,
    maxPrice: Infinity,
  });
  const { bookingTourId, bookingFeedback, handleBooking, getTourBookingLockLabel } =
    useTourBooking();

  const deferredSearch = useDeferredValue(filters.search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const searchableText = [
        tour.title,
        tour.country,
        tour.city,
        tour.description || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesPrice = tour.basePrice >= filters.minPrice && tour.basePrice <= filters.maxPrice;

      return matchesSearch && matchesPrice;
    });
  }, [tours, normalizedSearch, filters.minPrice, filters.maxPrice]);

  return (
    <>
      <section id="tours" className="mt-20 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_50%,#38bdf8_100%)] px-8 py-12 text-white shadow-[0_20px_80px_rgba(15,23,42,0.24)]">
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
              Каталог туров
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Подберите путешествие под свой ритм и настроение
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              Выбирайте направление, даты и бюджет — здесь собраны варианты для отпуска, коротких выездов и больших впечатлений.
            </p>
          </div>

          <TourFilters
            filters={filters}
            onFilterChange={(nextFilters) => {
              startTransition(() => setFilters(nextFilters));
            }}
          />

          {bookingFeedback ? (
            <div
              className={`mb-6 rounded-2xl px-5 py-4 text-sm ${
                bookingFeedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {bookingFeedback.message}
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[400px] animate-pulse rounded-[28px] bg-white shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-12 text-center text-red-700">
              Сейчас не удалось загрузить каталог туров: {error}
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center">
              <p className="text-xl font-semibold text-slate-700">
                Ничего не найдено по выбранным фильтрам
              </p>
              <button
                type="button"
                onClick={() => setFilters({ search: "", minPrice: 0, maxPrice: Infinity })}
                className="mt-4 rounded-full bg-amber-500 px-5 py-2.5 font-medium text-white transition hover:bg-amber-600"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredTours.map((tour, index) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  index={index}
                  footer={
                    <TourCardActions
                      tour={tour}
                      session={session}
                      profileLoading={profileLoading}
                      profileComplete={profileComplete}
                      profileError={profileError}
                      bookingTourId={bookingTourId}
                      bookingLockLabel={getTourBookingLockLabel(tour.id)}
                      onBook={handleBooking}
                      showFavoriteButton={favoritesAvailable}
                      isFavorite={isFavorite(tour.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </>
  );
}
