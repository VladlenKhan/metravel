import { useEffect } from "react";
import { FiAlertCircle, FiArrowRight, FiClock, FiDollarSign, FiMapPin } from "react-icons/fi";
import { FaPlaneDeparture } from "react-icons/fa";
import { Link } from "react-router-dom";
import Testimonials from "./Testimonials";
import TourCardActions from "./TourCardActions";
import TourCard from "./TourCard";
import { useAuthSession } from "../hooks/useAuthSession";
import { useFavoriteTours } from "../hooks/useFavoriteTours";
import { useClientProfileStatus } from "../hooks/useClientProfileStatus";
import { useTourBooking } from "../hooks/useTourBooking";
import { useTours } from "../hooks/useTours";

const whyUs = [
  {
    icon: FiClock,
    title: "Круглосуточная поддержка",
    desc: "24/7 на связи в чате, по телефону и WhatsApp",
  },
  {
    icon: FaPlaneDeparture,
    title: "Проверенные маршруты",
    desc: "Собираем направления, которые хочется рекомендовать друзьям и выбирать снова.",
  },
  {
    icon: FiDollarSign,
    title: "Актуальные цены",
    desc: "Показываем свежие предложения, чтобы вы могли спокойно планировать поездку по своему бюджету.",
  },
  {
    icon: FiMapPin,
    title: "Удобный выбор",
    desc: "Новые предложения быстро появляются в каталоге, чтобы лучшие варианты не проходили мимо.",
  },
];

const HOME_TOUR_LIMIT = 3;

function byLowestPrice(a: { basePrice: number }, b: { basePrice: number }) {
  return a.basePrice - b.basePrice;
}

function byClosestDate(a: { startDate: string }, b: { startDate: string }) {
  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
}

export default function MainContent() {
  const session = useAuthSession();
  const { tours, loading, error } = useTours();
  const { isFavorite, toggleFavorite, isAvailable: favoritesAvailable } = useFavoriteTours();
  const {
    loading: profileLoading,
    error: profileError,
    isComplete: profileComplete,
  } = useClientProfileStatus();
  const {
    bookingTourId,
    bookingFeedback,
    handleBooking,
    clearBookingFeedback,
    getTourBookingLockLabel,
  } =
    useTourBooking();
  const featuredTours = [...tours].sort(byLowestPrice).slice(0, HOME_TOUR_LIMIT);
  const upcomingTours = [...tours].sort(byClosestDate).slice(0, HOME_TOUR_LIMIT);
  const openTravelAssistant = () => {
    window.dispatchEvent(
      new CustomEvent("metravel-open-travel-chat", {
        detail: { restart: true },
      })
    );
  };

  useEffect(() => {
    if (!bookingFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearBookingFeedback();
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [bookingFeedback, clearBookingFeedback]);

  return (
    <main className="bg-gray-50 pb-20 pt-8">
      {bookingFeedback ? (
        <div className="pointer-events-none fixed right-5 top-24 z-40 w-[min(92vw,420px)]">
          <div
            className={`rounded-[24px] px-5 py-4 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.18)] ${
              bookingFeedback.type === "success"
                ? "border border-emerald-200 bg-white text-emerald-700"
                : "border border-red-200 bg-white text-red-700"
            }`}
          >
            <div className="font-semibold">
              {bookingFeedback.type === "success"
                ? "Тур успешно забронирован"
                : "Не удалось оформить бронирование"}
            </div>
            <div className="mt-1 leading-6 text-slate-600">{bookingFeedback.message}</div>
          </div>
        </div>
      ) : null}

      <section id="tours" className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-12 text-center md:mb-16">
            <p className="mb-4 inline-flex rounded-full bg-sky-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">
              Популярные туры
            </p>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">
              Направления, которые особенно любят наши путешественники
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[400px] animate-pulse rounded-[28px] bg-white shadow-sm"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
              <div className="mb-3 inline-flex items-center gap-2 text-base font-semibold">
                <FiAlertCircle />
                Не удалось открыть подборку туров
              </div>
              <p className="text-sm md:text-base">{error}</p>
            </div>
          ) : featuredTours.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
              Скоро здесь появятся новые направления для путешествий.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {featuredTours.map((tour, index) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  index={index}
                  badge="Хит"
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

          <div className="mt-12 text-center">
            <Link
              to="/tours"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-medium text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-xl"
            >
              Открыть весь каталог <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section id="countries" className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 text-center md:mb-14">
            <p className="mb-4 inline-flex rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-amber-700">
              Ближайшие выезды
            </p>
            <h2 className="text-3xl font-bold text-gray-900 md:text-5xl">Что стартует раньше всего</h2>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[400px] animate-pulse rounded-[28px] bg-white shadow-sm"
                />
              ))}
            </div>
          ) : upcomingTours.length > 0 ? (
            <div className="flex flex-col gap-6">
              {upcomingTours.map((tour, index) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  index={index + 1}
                  badge="Скоро"
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
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
              Скоро здесь появятся новые даты ближайших выездов.
            </div>
          )}
        </div>
      </section>

      <section id="about" className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="text-3xl font-bold text-gray-900 md:text-5xl">Почему выбирают MeTravel</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 md:gap-10">
            {whyUs.map((item, idx) => (
              <div key={idx} className="px-4 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">
                  <item.icon />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <section id="find" className="bg-indigo-600 py-20 text-white">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">Подберём идеальный тур за 5 минут</h2>
            <p className="text-xl opacity-90">
              Можно сразу перейти в каталог или открыть чат-помощник, который задаст несколько коротких вопросов.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/15 bg-white/10 px-6 py-6 backdrop-blur-sm">
              <div className="text-sm uppercase tracking-[0.18em] text-white/60">Шаг 1</div>
              <div className="mt-3 text-2xl font-semibold">Откройте чат-помощник</div>
              <p className="mt-3 text-white/80">
                Бот подскажет направление, бюджет и длительность поездки, а затем предложит туры.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/15 bg-white/10 px-6 py-6 backdrop-blur-sm">
              <div className="text-sm uppercase tracking-[0.18em] text-white/60">Шаг 2</div>
              <div className="mt-3 text-2xl font-semibold">Сравните варианты</div>
              <p className="mt-3 text-white/80">
                Выберите тур из каталога, проверьте даты, услуги и наличие свободных мест.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/15 bg-white/10 px-6 py-6 backdrop-blur-sm">
              <div className="text-sm uppercase tracking-[0.18em] text-white/60">Шаг 3</div>
              <div className="mt-3 text-2xl font-semibold">Отправьте бронирование</div>
              <p className="mt-3 text-white/80">
                После заявки статус поездки появится в личном кабинете, а менеджер сможет продолжить сопровождение.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={openTravelAssistant}
              className="rounded-xl bg-amber-500 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-amber-600 hover:shadow-2xl"
            >
              Открыть чат-помощник
            </button>

            <Link
              to="/tours"
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white transition hover:bg-white/15"
            >
              Перейти в каталог
            </Link>

            {session?.role === "Client" ? (
              <Link
                to="/bookings"
                className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white transition hover:bg-white/15"
              >
                Мои бронирования
              </Link>
            ) : session ? (
              <Link
                to="/admin"
                className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white transition hover:bg-white/15"
              >
                Панель сотрудника
              </Link>
            ) : (
              <Link
                to="/register"
                className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white transition hover:bg-white/15"
              >
                Создать аккаунт
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
