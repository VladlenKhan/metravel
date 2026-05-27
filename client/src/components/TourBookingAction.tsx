import { LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { AuthSession, Tour } from "../api/api";

type TourBookingActionProps = {
  tour: Tour;
  session: AuthSession | null;
  profileLoading: boolean;
  profileComplete: boolean;
  profileError: string | null;
  bookingTourId: string | null;
  bookingLockLabel: string | null;
  onBook: (tour: Tour) => void;
};

export default function TourBookingAction({
  tour,
  session,
  profileLoading,
  profileComplete,
  profileError,
  bookingTourId,
  bookingLockLabel,
  onBook,
}: TourBookingActionProps) {
  if (!session) {
    return (
      <div className="space-y-3">
        <Link
          to="/login"
          className="block rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Войти для бронирования
        </Link>
      </div>
    );
  }

  if (session.role !== "Client") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Бронирование из каталога доступно для клиентов.
      </div>
    );
  }

  if (profileLoading) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
      >
        <LoaderCircle size={16} className="animate-spin" />
        Проверяем профиль
      </button>
    );
  }

  if (profileError) {
    return (
      <Link
        to="/profile"
        state={{ profileSetupRequired: true }}
        className="block rounded-full bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-600"
      >
        Открыть профиль
      </Link>
    );
  }

  if (!profileComplete) {
    return (
      <div className="space-y-3">
        <Link
          to="/profile"
          state={{ profileSetupRequired: true }}
          className="block rounded-full bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          Заполнить профиль
        </Link>
        <p className="text-xs leading-5 text-amber-700">
          Для бронирования нужно указать телефон и паспортные данные в личном кабинете.
        </p>
      </div>
    );
  }

  if (tour.availableSeats <= 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
      >
        Мест нет
      </button>
    );
  }

  const isSubmitting = bookingTourId !== null;
  const isCurrentTourSubmitting = bookingTourId === tour.id;
  const isLockedByExistingBooking = Boolean(bookingLockLabel);
  const isDisabled = isSubmitting || isLockedByExistingBooking;

  return (
    <button
      type="button"
      onClick={() => onBook(tour)}
      disabled={isDisabled}
      className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
        isLockedByExistingBooking && !isCurrentTourSubmitting
          ? "bg-slate-200 text-slate-500"
          : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
      }`}
    >
      {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {isCurrentTourSubmitting
        ? "Отправляем заявку..."
        : isSubmitting
          ? "Ожидаем ответ сервера..."
          : isLockedByExistingBooking
            ? bookingLockLabel
            : "Забронировать"}
    </button>
  );
}
