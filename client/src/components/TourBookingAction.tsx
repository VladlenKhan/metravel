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
          className="block rounded-full bg-slate-900 px-4 py-3 text-center text-[13px] font-semibold leading-tight text-white transition hover:bg-slate-800 sm:text-sm"
        >
          <span className="sm:hidden">Войти и забронировать</span>
          <span className="hidden sm:inline">Войти для бронирования</span>
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
          className="block rounded-full bg-amber-500 px-4 py-3 text-center text-[13px] font-semibold leading-tight text-white transition hover:bg-amber-600 sm:text-sm"
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
          className="block rounded-full bg-amber-500 px-4 py-3 text-center text-[13px] font-semibold leading-tight text-white transition hover:bg-amber-600 sm:text-sm"
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
        className="w-full rounded-full bg-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-500 sm:text-sm"
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
      className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-center text-[13px] font-semibold leading-tight transition disabled:cursor-not-allowed sm:text-sm ${
        isLockedByExistingBooking && !isCurrentTourSubmitting
          ? "bg-slate-200 text-slate-500"
          : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
      }`}
    >
      {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {isCurrentTourSubmitting ? (
        <>
          <span className="sm:hidden">Отправляем...</span>
          <span className="hidden sm:inline">Отправляем заявку...</span>
        </>
      ) : isSubmitting ? (
        <>
          <span className="sm:hidden">Подождите...</span>
          <span className="hidden sm:inline">Ожидаем ответ сервера...</span>
        </>
      ) : isLockedByExistingBooking ? (
        bookingLockLabel
      ) : (
        "Забронировать"
      )}
    </button>
  );
}
