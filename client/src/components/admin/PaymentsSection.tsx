import { BanknoteArrowDown, CheckCircle2, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { cancelPayment, createPayment, payPayment } from "../../api/api";
import { useFrontOfficeStore } from "../../hooks/useFrontOfficeStore";
import { saveLocalPayment, updateLocalPaymentStatus } from "../../lib/frontOfficeStore";
import { createLocalGuid, isRecoverableConnectionIssue } from "../../lib/network";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
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
        label: "Отменено",
        className: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
      };
    case "Pending":
      return {
        label: "Ожидает оплаты",
        className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      };
    default:
      return {
        label: "Еще не создано",
        className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      };
  }
}

export default function PaymentsSection() {
  const { bookings, payments } = useFrontOfficeStore();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  const activeBookings = useMemo(
    () => sortedBookings.filter((booking) => booking.status !== "Cancelled"),
    [sortedBookings]
  );

  const hiddenCancelledBookingsCount = sortedBookings.length - activeBookings.length;
  const visiblePaymentsCount = useMemo(
    () =>
      activeBookings.filter((booking) => paymentsByBookingId.has(booking.id)).length,
    [activeBookings, paymentsByBookingId]
  );
  const paidVisiblePaymentsCount = useMemo(
    () =>
      activeBookings.filter(
        (booking) => paymentsByBookingId.get(booking.id)?.status === "Paid"
      ).length,
    [activeBookings, paymentsByBookingId]
  );
  const pendingVisiblePaymentsCount = useMemo(
    () =>
      activeBookings.filter(
        (booking) => paymentsByBookingId.get(booking.id)?.status === "Pending"
      ).length,
    [activeBookings, paymentsByBookingId]
  );

  const handleCreatePayment = async (
    bookingId: string,
    amount: number,
    clientId: string,
    clientFullName: string,
    tourTitle: string
  ) => {
    setFeedback(null);
    setPendingId(bookingId);

    try {
      const payment = await createPayment(bookingId, amount);
      saveLocalPayment({
        id: payment.id,
        bookingId,
        clientId,
        clientFullName,
        tourTitle,
        amount: payment.amount,
        status: payment.status,
      });
      setFeedback({
        type: "success",
        message: "Платеж создан и привязан к заявке.",
      });
    } catch (creationError) {
      if (isRecoverableConnectionIssue(creationError)) {
        saveLocalPayment({
          id: createLocalGuid(),
          bookingId,
          clientId,
          clientFullName,
          tourTitle,
          amount,
          status: "Pending",
        });
        setFeedback({
          type: "success",
          message:
            "Платеж сохранен локально. Сервер оплат временно недоступен, но с заявкой уже можно продолжать работать.",
        });
        setPendingId(null);
        return;
      }

      setFeedback({
        type: "error",
        message:
          creationError instanceof Error ? creationError.message : "Не удалось создать платеж.",
      });
    } finally {
      setPendingId(null);
    }
  };

  const handlePaymentAction = async (
    paymentId: string,
    action: "pay" | "cancel"
  ) => {
    setFeedback(null);
    setPendingId(paymentId);

    try {
      const updatedPayment =
        action === "pay" ? await payPayment(paymentId) : await cancelPayment(paymentId);
      updateLocalPaymentStatus(paymentId, updatedPayment.status);
      setFeedback({
        type: "success",
        message: action === "pay" ? "Оплата подтверждена." : "Оплата отменена.",
      });
    } catch (actionError) {
      if (isRecoverableConnectionIssue(actionError)) {
        updateLocalPaymentStatus(paymentId, action === "pay" ? "Paid" : "Cancelled");
        setFeedback({
          type: "success",
          message:
            action === "pay"
              ? "Оплата отмечена локально как подтвержденная."
              : "Оплата отмечена локально как отмененная.",
        });
        setPendingId(null);
        return;
      }

      setFeedback({
        type: "error",
        message:
          actionError instanceof Error
            ? actionError.message
            : "Не удалось обновить статус оплаты.",
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Оплаты и выставленные платежи</h2>
          <p className="text-sm text-slate-500">
            Здесь показываются только активные бронирования. Для отмененных заявок оплаты скрываются автоматически.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
          <CreditCard size={16} />
          Видимых оплат: {visiblePaymentsCount}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Ожидают оплаты</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{pendingVisiblePaymentsCount}</div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Оплачено</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{paidVisiblePaymentsCount}</div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Скрыто после отмены</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{hiddenCancelledBookingsCount}</div>
        </div>
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
          Сначала появятся заявки на бронирование, а затем для них можно будет выставлять оплату.
        </div>
      ) : activeBookings.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-slate-500">
          Все текущие заявки отменены, поэтому оплаты сейчас скрыты из списка.
        </div>
      ) : (
        <div className="mt-6 max-h-[980px] space-y-4 overflow-y-auto pr-2">
          {activeBookings.map((booking) => {
            const payment = paymentsByBookingId.get(booking.id) ?? null;
            const statusMeta = getPaymentStatusMeta(payment?.status ?? null);
            const isBusy = pendingId === booking.id || pendingId === payment?.id;

            return (
              <article
                key={booking.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{booking.tourTitle}</h3>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1">{booking.clientFullName}</span>
                      <span className="rounded-full bg-white px-3 py-1">
                        {formatPrice(booking.totalPrice)}
                      </span>
                      {payment ? (
                        <span className="rounded-full bg-white px-3 py-1">
                          Платеж #{payment.id.slice(0, 8)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {!payment ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        void handleCreatePayment(
                          booking.id,
                          booking.totalPrice,
                          booking.clientId,
                          booking.clientFullName,
                          booking.tourTitle
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isBusy ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <BanknoteArrowDown size={16} />
                      )}
                      Создать оплату
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={payment.status !== "Pending" || isBusy}
                        onClick={() => void handlePaymentAction(payment.id, "pay")}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {isBusy && pendingId === payment.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Отметить как оплачено
                      </button>

                      <button
                        type="button"
                        disabled={payment.status !== "Pending" || isBusy}
                        onClick={() => void handlePaymentAction(payment.id, "cancel")}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        {isBusy && pendingId === payment.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Отменить оплату
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
