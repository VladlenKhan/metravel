import { CalendarClock, CreditCard, MapPin, ShieldCheck, Ticket, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import { useAuthSession } from "../hooks/useAuthSession";
import { useClientProfileStatus } from "../hooks/useClientProfileStatus";
import { useFrontOfficeStore } from "../hooks/useFrontOfficeStore";
import {
  saveLocalPayment,
  updateLocalBookingStatus,
  updateLocalPaymentStatus,
  updateLocalPaymentStatusByBookingId,
} from "../lib/frontOfficeStore";
import { createLocalGuid } from "../lib/network";

type ClientBookingView = "Created" | "Confirmed" | "Completed" | "Cancelled";

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

function getBookingStatusMeta(status: string): { label: string; className: string } {
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
        label: "На рассмотрении",
        className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      };
  }
}

function getPaymentStatusMeta(status: string | null): { label: string; className: string } {
  switch (status) {
    case "Paid":
      return {
        label: "Оплачено",
        className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      };
    case "Cancelled":
      return {
        label: "Оплата отменена",
        className: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
      };
    case "Pending":
      return {
        label: "Ожидает оплаты",
        className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      };
    default:
      return {
        label: "Пока не выставлена",
        className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      };
  }
}

export default function Bookings() {
  const session = useAuthSession();
  const { currentUser, loading, error, sessionRole } = useClientProfileStatus();
  const { bookings, payments } = useFrontOfficeStore();
  const [selectedView, setSelectedView] = useState<ClientBookingView>("Created");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"cancel" | "pay" | null>(null);

  const myBookings = useMemo(() => {
    const currentClientId = currentUser?.clientId ?? currentUser?.id ?? "";
    const sessionEmail = session?.email?.trim().toLowerCase() ?? "";

    return bookings
      .filter((booking) => {
        const matchesClientId = currentClientId.length > 0 && booking.clientId === currentClientId;
        const matchesEmail =
          sessionEmail.length > 0 &&
          booking.clientEmail.trim().toLowerCase() === sessionEmail;

        return matchesClientId || matchesEmail;
      })
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
  }, [bookings, currentUser?.clientId, currentUser?.id, session?.email]);

  const paymentsByBookingId = useMemo(
    () => new Map(payments.map((payment) => [payment.bookingId, payment])),
    [payments]
  );

  const bookingSections = useMemo(
    () => [
      {
        status: "Created" as const,
        title: "На рассмотрении",
        shortTitle: "Новые",
        description: "Заявки уже отправлены и ждут подтверждения менеджером.",
        badgeClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        buttonClassName:
          "data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:shadow-lg",
        count: myBookings.filter((booking) => booking.status === "Created").length,
      },
      {
        status: "Confirmed" as const,
        title: "Подтвержденные",
        shortTitle: "Подтверждены",
        description: "Поездки подтверждены и готовы к дальнейшему сопровождению.",
        badgeClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        buttonClassName:
          "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:shadow-lg",
        count: myBookings.filter((booking) => booking.status === "Confirmed").length,
      },
      {
        status: "Completed" as const,
        title: "Завершенные",
        shortTitle: "Завершены",
        description: "История поездок, которые уже успешно завершились.",
        badgeClassName: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
        buttonClassName:
          "data-[active=true]:bg-sky-600 data-[active=true]:text-white data-[active=true]:shadow-lg",
        count: myBookings.filter((booking) => booking.status === "Completed").length,
      },
      {
        status: "Cancelled" as const,
        title: "Отмененные",
        shortTitle: "Отменены",
        description: "История отмененных заявок. Информация об оплате по ним скрывается.",
        badgeClassName: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        buttonClassName:
          "data-[active=true]:bg-rose-600 data-[active=true]:text-white data-[active=true]:shadow-lg",
        count: myBookings.filter((booking) => booking.status === "Cancelled").length,
      },
    ],
    [myBookings]
  );

  const selectedSection =
    bookingSections.find((section) => section.status === selectedView) ?? bookingSections[0];
  const selectedBookings = useMemo(
    () => myBookings.filter((booking) => booking.status === selectedSection.status),
    [myBookings, selectedSection.status]
  );
  const shouldScrollSelectedBookings = selectedBookings.length > 3;

  const handleCancelBooking = (bookingId: string) => {
    const confirmed = window.confirm("Отменить это бронирование?");
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setPendingBookingId(bookingId);
    setPendingAction("cancel");

    try {
      updateLocalBookingStatus(bookingId, "Cancelled");
      updateLocalPaymentStatusByBookingId(bookingId, "Cancelled");
      setFeedback({
        type: "success",
        message: "Бронирование отменено.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Не удалось отменить бронирование.",
      });
    } finally {
      setPendingBookingId(null);
      setPendingAction(null);
    }
  };

  const handlePayBooking = (booking: (typeof myBookings)[number]) => {
    const existingPayment = paymentsByBookingId.get(booking.id) ?? null;

    setFeedback(null);
    setPendingBookingId(booking.id);
    setPendingAction("pay");

    try {
      if (existingPayment) {
        updateLocalPaymentStatus(existingPayment.id, "Paid");
      } else {
        saveLocalPayment({
          id: createLocalGuid(),
          bookingId: booking.id,
          clientId: booking.clientId,
          clientFullName: booking.clientFullName,
          tourTitle: booking.tourTitle,
          amount: booking.totalPrice,
          status: "Paid",
        });
      }

      setFeedback({
        type: "success",
        message: "Вы оплатили тур. Статус оплаты уже отображается у менеджера и в разделе оплат.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Не удалось обновить статус оплаты. Попробуйте еще раз.",
      });
    } finally {
      setPendingBookingId(null);
      setPendingAction(null);
    }
  };

  if (sessionRole && sessionRole !== "Client") {
    return (
      <>
        <section className="mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-12">
            <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
              <h1 className="text-3xl font-bold text-slate-900">Мои бронирования</h1>
              <p className="mt-4 text-slate-600">
                Этот раздел предназначен для клиентов, которые оформляют поездки.
              </p>
            </div>
          </div>
        </section>
        <Footer />
        <ScrollToTop />
      </>
    );
  }

  const renderBookingCard = (booking: (typeof myBookings)[number]) => {
    const payment = paymentsByBookingId.get(booking.id) ?? null;
    const shouldShowPayment = booking.status !== "Cancelled";
    const bookingStatus = getBookingStatusMeta(booking.status);
    const paymentStatus = getPaymentStatusMeta(
      shouldShowPayment ? payment?.status ?? null : null
    );
    const canCancelBooking = booking.status === "Created" || booking.status === "Confirmed";
    const isBookingActionPending = pendingBookingId === booking.id;
    const isCancellingBooking = isBookingActionPending && pendingAction === "cancel";
    const isPayingBooking = isBookingActionPending && pendingAction === "pay";
    const canPayBooking =
      shouldShowPayment && booking.status !== "Completed" && payment?.status !== "Paid";
    const paymentActionLabel =
      payment?.status === "Cancelled" ? "Оплатить повторно" : "Оплатить";

    return (
      <article
        key={booking.id}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-slate-900">{booking.tourTitle}</h2>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${bookingStatus.className}`}
              >
                {bookingStatus.label}
              </span>
              {shouldShowPayment ? (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentStatus.className}`}
                >
                  {paymentStatus.label}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                <MapPin size={15} />
                {booking.tourCity}, {booking.tourCountry}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                <CalendarClock size={15} />
                {formatDateTime(booking.bookingDate)}
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm">
            <div className="text-slate-500">Стоимость поездки</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {formatPrice(booking.totalPrice)}
            </div>
            <div className="mt-2 text-slate-500">
              {!shouldShowPayment
                ? "Бронирование отменено, поэтому информация об оплате скрыта."
                : payment?.status === "Paid"
                  ? "Оплата успешно получена и уже отмечена в системе."
                  : payment
                    ? "Оплата уже привязана к заявке. Можно оплатить тур прямо сейчас, и статус обновится у менеджера."
                    : booking.status === "Completed"
                      ? "Поездка завершена."
                      : "Можно оплатить тур прямо сейчас, и статус сразу появится в админ-панели."
              }
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {canPayBooking ? (
                <button
                  type="button"
                  disabled={isBookingActionPending}
                  onClick={() => handlePayBooking(booking)}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={16} />
                  {isPayingBooking ? "Проводим оплату..." : paymentActionLabel}
                </button>
              ) : null}

              {canCancelBooking ? (
                <button
                  type="button"
                  disabled={isBookingActionPending}
                  onClick={() => handleCancelBooking(booking.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle size={16} />
                  {isCancellingBooking ? "Отменяем..." : "Отменить бронирование"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      <section className="mt-20 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#22c55e_100%)] px-8 py-12 text-white shadow-[0_24px_90px_rgba(15,23,42,0.24)]">
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
              Личный кабинет
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Мои бронирования и статусы поездок
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              Здесь удобно следить за заявками, подтверждением поездки и состоянием оплаты.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {feedback ? (
            <div
              className={`mb-6 rounded-2xl px-5 py-4 text-sm ${
                feedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {bookingSections.map((section) => (
              <div
                key={section.status}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 text-slate-500">
                  {section.status === "Created" ? (
                    <Ticket size={18} />
                  ) : section.status === "Confirmed" ? (
                    <ShieldCheck size={18} />
                  ) : section.status === "Completed" ? (
                    <CreditCard size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  {section.shortTitle}
                </div>
                <div className="mt-3 text-3xl font-bold text-slate-900">{section.count}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-[28px] bg-white shadow-sm" />
              ))}
            </div>
          ) : myBookings.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">Бронирований пока нет</h2>
              <p className="mt-3 text-slate-500">
                Как только вы отправите заявку из каталога туров, она появится здесь со статусом обработки.
              </p>
            </div>
          ) : (
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Разделы бронирований</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Выберите нужный статус и смотрите только те заявки, которые важны сейчас.
                  </p>
                </div>

                <div className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  Всего заявок: {myBookings.length}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {bookingSections.map((section) => (
                  <button
                    key={section.status}
                    type="button"
                    data-active={selectedView === section.status}
                    onClick={() => setSelectedView(section.status)}
                    className={`inline-flex items-center gap-3 rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 ${section.buttonClassName}`}
                  >
                    <span>{section.shortTitle}</span>
                    <span
                      className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        selectedView === section.status
                          ? "bg-white/15 text-white"
                          : section.badgeClassName
                      }`}
                    >
                      {section.count}
                    </span>
                  </button>
                ))}
              </div>

              <section className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedSection.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{selectedSection.description}</p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${selectedSection.badgeClassName}`}
                  >
                    {selectedBookings.length}
                  </span>
                </div>

                {selectedBookings.length === 0 ? (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
                    В этом разделе пока нет бронирований.
                  </div>
                ) : (
                  <div
                    className={`mt-6 space-y-5 ${
                      shouldScrollSelectedBookings ? "max-h-[860px] overflow-y-auto pr-1" : ""
                    }`}
                  >
                    {selectedBookings.map(renderBookingCard)}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </>
  );
}
