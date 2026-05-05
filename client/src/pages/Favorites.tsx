import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import TourCard from "../components/TourCard";
import TourCardActions from "../components/TourCardActions";
import { useAuthSession } from "../hooks/useAuthSession";
import { useClientProfileStatus } from "../hooks/useClientProfileStatus";
import { useFavoriteTours } from "../hooks/useFavoriteTours";
import { useTourBooking } from "../hooks/useTourBooking";
import { useTours } from "../hooks/useTours";

export default function Favorites() {
  const session = useAuthSession();
  const { tours, loading, error } = useTours();
  const { favoriteTourIds, isFavorite, toggleFavorite, favoriteCount, isAvailable } = useFavoriteTours();
  const {
    loading: profileLoading,
    error: profileError,
    isComplete: profileComplete,
  } = useClientProfileStatus();
  const { bookingFeedback, bookingTourId, handleBooking, getTourBookingLockLabel } =
    useTourBooking();

  const favoriteTours = tours.filter((tour) => favoriteTourIds.includes(tour.id));

  return (
    <>
      <section className="mt-20 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 rounded-[32px] bg-[linear-gradient(135deg,#1f2937_0%,#be123c_52%,#fb7185_100%)] px-8 py-12 text-white shadow-[0_20px_80px_rgba(15,23,42,0.24)]">
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
              Желаемые туры
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Ваш личный список путешествий мечты
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              Сохраняйте интересные направления и возвращайтесь к ним, когда будете готовы к поездке.
            </p>
          </div>

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
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[400px] animate-pulse rounded-[28px] bg-white shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-12 text-center text-red-700">
              Сейчас не удалось открыть желаемые туры: {error}
            </div>
          ) : favoriteCount === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center">
              <p className="text-xl font-semibold text-slate-700">У вас пока нет желаемых туров</p>
              <p className="mt-3 text-slate-500">
                Откройте каталог, нажмите на сердечко у понравившегося направления и тур появится здесь.
              </p>
            </div>
          ) : favoriteTours.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center">
              <p className="text-xl font-semibold text-slate-700">Сохраненные туры пока недоступны</p>
              <p className="mt-3 text-slate-500">
                Часть туров могла измениться или временно исчезнуть из каталога.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {favoriteTours.map((tour, index) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  index={index}
                  badge="Избранное"
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
                      showFavoriteButton={isAvailable}
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
