import { CalendarClock, CheckCheck, CreditCard, MapPin, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { changeBookingStatus, type BookingStatus } from "../../api/api";
import { useFrontOfficeStore } from "../../hooks/useFrontOfficeStore";
import {
  updateLocalBookingStatus,
  updateLocalPaymentStatusByBookingId,
} from "../../lib/frontOfficeStore";
import { isRecoverableConnectionIssue } from "../../lib/network";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type BookingStatusSectionMeta = {
  status: BookingStatus;
  title: string;
  description: string;
  emptyState: string;
  sectionClassName: string;
};

function formatDateTime(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Дата уточняется";
  }

  return parsedDate.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusMeta(status: string): { label: string; className: string } {
  switch (status) {
    case "Confirmed":
      return {
        label: "Подтверждена",
        className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      };
    case "Cancelled":
      return {
        label: "Отменена",
        className: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
      };
    case "Completed":
      return {
        label: "Завершена",
        className: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
      };
    case "Created":
    default:
      return {
        label: "Новая заявка",
        className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      };
  }
}

function getPaymentStatusLabel(status: string | null): string {
  switch (status) {
    case "Paid":
      return "Оплачено";
    case "Cancelled":
      return "Отменено";
    case "Pending":
      return "Ожидает оплаты";
    default:
      return "Оплата не создана";
  }
}

const availableStatuses: Array<Exclude<BookingStatus, "Created">> = [
  "Confirmed",
  "Cancelled",
  "Completed",
];

const bookingStatusSections: BookingStatusSectionMeta[] = [
  {
    status: "Created",
    title: "Новые заявки",
    description: "Ожидают подтверждения или отмены.",
    emptyState: "Новых заявок сейчас нет.",
    sectionClassName: "bg-amber-50/70 border-amber-100",
  },
  {
    status: "Confirmed",
    title: "Подтвержденные",
    description: "Поездки в работе и на сопровождении.",
    emptyState: "Подтвержденных поездок пока нет.",
    sectionClassName: "bg-emerald-50/70 border-emerald-100",
  },
  {
    status: "Completed",
    title: "Завершенные",
    description: "Архив успешно завершенных туров.",
    emptyState: "Завершенных поездок пока нет.",
    sectionClassName: "bg-sky-50/70 border-sky-100",
  },
  {
    status: "Cancelled",
    title: "Отмененные",
    description: "Заявки, которые были закрыты без поездки.",
    emptyState: "Отмененных заявок пока нет.",
    sectionClassName: "bg-rose-50/70 border-rose-100",
  },
];

export default function BookingsSection() {
  const { bookings, payments } = useFrontOfficeStore();
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedBookingStatus, setSelectedBookingStatus] =
    useState<BookingStatus>("Created");

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [bookings]
  );

  const paymentsByBookingId = useMemo(
    () => new Map(payments.map((payment) => [payment.bookingId, payment])),
    [payments]
  );

  const groupedBookings = useMemo(
    () =>
      bookingStatusSections.map((section) => ({
        ...section,
        bookings: sortedBookings.filter((booking) => booking.status === section.status),
      })),
    [sortedBookings]
  );

  const selectedBookingSection =
    groupedBookings.find((section) => section.status === selectedBookingStatus) ??
    groupedBookings[0];

  const handleStatusChange = async (
    bookingId: string,
    status: Exclude<BookingStatus, "Created">
  ) => {
    setFeedback(null);
    setPendingBookingId(bookingId);

    try {
      await changeBookingStatus(bookingId, status);
      updateLocalBookingStatus(bookingId, status);
      if (status === "Cancelled") {
        updateLocalPaymentStatusByBookingId(bookingId, "Cancelled");
      }
      setFeedback({
        type: "success",
        message: "Статус заявки обновлен.",
      });
    } catch (statusError) {
      if (isRecoverableConnectionIssue(statusError)) {
        updateLocalBookingStatus(bookingId, status);
        if (status === "Cancelled") {
          updateLocalPaymentStatusByBookingId(bookingId, "Cancelled");
        }
        setFeedback({
          type: "success",
          message: "Статус заявки обновлен локально. Сервер бронирований временно недоступен.",
        });
        setPendingBookingId(null);
        return;
      }

      setFeedback({
        type: "error",
        message:
          statusError instanceof Error
            ? statusError.message
            : "Не удалось обновить статус заявки.",
      });
    } finally {
      setPendingBookingId(null);
    }
  };

  const renderBookingCard = (booking: (typeof bookings)[number]) => {
    const statusMeta = getStatusMeta(booking.status);
    const payment = paymentsByBookingId.get(booking.id) ?? null;

    return (
      <article
        key={booking.id}
        className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{booking.tourTitle}</h3>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1">{booking.clientFullName}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">{booking.clientEmail}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">
                {formatPrice(booking.totalPrice)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                <MapPin size={14} />
                {booking.tourCity}, {booking.tourCountry}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                <CalendarClock size={14} />
                {formatDateTime(booking.bookingDate)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                <CreditCard size={14} />
                {getPaymentStatusLabel(payment?.status ?? null)}
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[360px]">
            {availableStatuses.map((status) => {
              const isCurrent = booking.status === status;
              const isPending = pendingBookingId === booking.id;

              return (
                <button
                  key={`${booking.id}-${status}`}
                  type="button"
                  disabled={isPending || isCurrent}
                  onClick={() => void handleStatusChange(booking.id, status)}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    status === "Confirmed"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : status === "Completed"
                        ? "bg-sky-600 text-white hover:bg-sky-700"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                >
                  {isPending ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : status === "Confirmed" ? (
                    <CheckCheck size={15} />
                  ) : status === "Completed" ? (
                    <ShieldCheck size={15} />
                  ) : (
                    <XCircle size={15} />
                  )}
                  {status === "Confirmed"
                    ? "Подтвердить"
                    : status === "Completed"
                      ? "Завершить"
                      : "Отменить"}
                </button>
              );
            })}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Заявки на бронирование</h2>
          <p className="text-sm text-slate-500">
            Здесь менеджер подтверждает новые заявки и ведет их до завершения поездки.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
          <ShieldCheck size={16} />
          Всего заявок: {sortedBookings.length}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {groupedBookings.map((section) => {
          const statusMeta = getStatusMeta(section.status);
          const isActive = selectedBookingStatus === section.status;

          return (
            <button
              key={section.status}
              type="button"
              onClick={() => setSelectedBookingStatus(section.status)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{section.title}</span>
              <span
                className={`inline-flex min-w-7 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  isActive ? "bg-white/15 text-white" : statusMeta.className
                }`}
              >
                {section.bookings.length}
              </span>
            </button>
          );
        })}
      </div>

      {feedback ? (
        <div
          className={`mt-6 rounded-2xl px-5 py-4 text-sm ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {sortedBookings.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-slate-500">
          Бронирования появятся здесь после первых заявок из клиентского каталога.
        </div>
      ) : (
        <section
          className={`mt-6 rounded-[24px] border p-5 ${selectedBookingSection.sectionClassName}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedBookingSection.title}
              </h3>
              <p className="mt-1 text-[13px] text-slate-500">
                {selectedBookingSection.description}
              </p>
            </div>
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              {selectedBookingSection.bookings.length}
            </span>
          </div>

          {selectedBookingSection.bookings.length === 0 ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              {selectedBookingSection.emptyState}
            </div>
          ) : (
            <div
              className={`mt-4 space-y-3 ${
                selectedBookingSection.bookings.length > 3
                  ? "max-h-[720px] overflow-y-auto pr-1"
                  : ""
              }`}
            >
              {selectedBookingSection.bookings.map((booking) => renderBookingCard(booking))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
