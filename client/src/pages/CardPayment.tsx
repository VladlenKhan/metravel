import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import { payPayment } from "../api/api";
import { useAuthSession } from "../hooks/useAuthSession";
import { useClientProfileStatus } from "../hooks/useClientProfileStatus";
import { useFrontOfficeStore } from "../hooks/useFrontOfficeStore";
import { updateLocalPaymentStatus } from "../lib/frontOfficeStore";
import {
  type CardPaymentField,
  type CardPaymentFieldErrors,
  type CardPaymentFormValues,
  formatCardNumberDisplay,
  sanitizeCardFirstNameInput,
  sanitizeCardLastNameInput,
  sanitizeCardNumberInput,
  sanitizeCvcInput,
  sanitizeExpiryInput,
  splitFullName,
  validateCardPaymentField,
  validateCardPaymentForm,
} from "../lib/cardValidation";
import { isRecoverableConnectionIssue } from "../lib/network";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function getInputClassName(hasError: boolean): string {
  return [
    "mt-1 w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2",
    hasError
      ? "border-red-300 bg-red-50/40 focus:ring-red-400"
      : "border-slate-200 focus:ring-emerald-500",
  ].join(" ");
}

export default function CardPayment() {
  const { bookingId = "" } = useParams();
  const navigate = useNavigate();
  const session = useAuthSession();
  const { currentUser } = useClientProfileStatus();
  const { bookings, payments } = useFrontOfficeStore();

  const prefilledNames = useMemo(() => {
    const fullName =
      currentUser?.fullName?.trim() || session?.fullName?.trim() || "";
    return splitFullName(fullName);
  }, [currentUser?.fullName, session?.fullName]);

  const [values, setValues] = useState<CardPaymentFormValues>({
    cardNumber: "",
    expiry: "",
    cvc: "",
    firstName: prefilledNames.firstName,
    lastName: prefilledNames.lastName,
  });
  const [errors, setErrors] = useState<CardPaymentFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<CardPaymentField, boolean>>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setValues((currentValues) => ({
      ...currentValues,
      firstName: currentValues.firstName || prefilledNames.firstName,
      lastName: currentValues.lastName || prefilledNames.lastName,
    }));
  }, [prefilledNames.firstName, prefilledNames.lastName]);

  const booking = useMemo(
    () => bookings.find((item) => item.id === bookingId) ?? null,
    [bookings, bookingId]
  );

  const payment = useMemo(
    () => payments.find((item) => item.bookingId === bookingId) ?? null,
    [payments, bookingId]
  );

  const cardDigits = sanitizeCardNumberInput(values.cardNumber);

  const setFieldValue = <K extends keyof CardPaymentFormValues>(
    field: K,
    nextValue: CardPaymentFormValues[K]
  ) => {
    setValues((currentValues) => {
      const updatedValues = { ...currentValues, [field]: nextValue };
      if (touched[field as CardPaymentField]) {
        const message = validateCardPaymentField(field as CardPaymentField, updatedValues);
        setErrors((currentErrors) => {
          const nextErrors = { ...currentErrors };
          if (message) {
            nextErrors[field as CardPaymentField] = message;
          } else {
            delete nextErrors[field as CardPaymentField];
          }
          return nextErrors;
        });
      }
      return updatedValues;
    });
    setFormError("");
  };

  const markTouched = (field: CardPaymentField) => {
    setTouched((currentTouched) => ({ ...currentTouched, [field]: true }));
    const message = validateCardPaymentField(field, values);
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      if (message) {
        nextErrors[field] = message;
      } else {
        delete nextErrors[field];
      }
      return nextErrors;
    });
  };

  const getVisibleError = (field: CardPaymentField): string | undefined => {
    if (!touched[field]) {
      return undefined;
    }
    return errors[field];
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const nextErrors = validateCardPaymentForm(values);
    setErrors(nextErrors);
    setTouched({
      cardNumber: true,
      expiry: true,
      cvc: true,
      firstName: true,
      lastName: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setFormError("Исправьте отмеченные поля — данные карты заполнены с ошибками.");
      return;
    }

    if (!payment || payment.status !== "Pending") {
      setFormError("Оплата для этого бронирования сейчас недоступна.");
      return;
    }

    setIsSubmitting(true);

    try {
      try {
        await payPayment(payment.id);
      } catch (paymentError) {
        if (!isRecoverableConnectionIssue(paymentError)) {
          throw paymentError;
        }
      }

      updateLocalPaymentStatus(payment.id, "Paid");
      setIsSuccess(true);
      setFormError("");
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось провести оплату. Попробуйте ещё раз."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bookingId) {
    return <Navigate to="/bookings" replace />;
  }

  if (!booking) {
    return (
      <>
        <section className="mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
            <div className="rounded-[28px] border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
              <h1 className="text-3xl font-bold text-slate-900">Бронирование не найдено</h1>
              <p className="mt-4 text-slate-600">
                Вернитесь в раздел «Мои бронирования» и выберите поездку снова.
              </p>
              <Link
                to="/bookings"
                className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                К бронированиям
              </Link>
            </div>
          </div>
        </section>
        <Footer />
        <ScrollToTop />
      </>
    );
  }

  if (!payment || payment.status !== "Pending") {
    return (
      <>
        <section className="mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-8 py-12 text-center shadow-sm">
              <h1 className="text-3xl font-bold text-slate-900">Оплата недоступна</h1>
              <p className="mt-4 text-slate-600">
                Счёт для тура «{booking.tourTitle}» ещё не выставлен или уже оплачен.
              </p>
              <Link
                to="/bookings"
                className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                К бронированиям
              </Link>
            </div>
          </div>
        </section>
        <Footer />
        <ScrollToTop />
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <section className="mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-8 py-12 text-center shadow-sm">
              <ShieldCheck className="mx-auto text-emerald-600" size={48} />
              <h1 className="mt-4 text-3xl font-bold text-slate-900">Оплата прошла успешно</h1>
              <p className="mt-4 text-slate-600">
                Тур «{booking.tourTitle}» оплачен на сумму {formatPrice(payment.amount)}.
                Статус обновлён в вашем личном кабинете.
              </p>
              <button
                type="button"
                onClick={() => navigate("/bookings", { replace: true })}
                className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Вернуться к бронированиям
              </button>
            </div>
          </div>
        </section>
        <Footer />
        <ScrollToTop />
      </>
    );
  }

  return (
    <>
      <section className="mt-20 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
          <div className="mb-8 rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#22c55e_100%)] px-8 py-10 text-white shadow-[0_24px_90px_rgba(15,23,42,0.24)]">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <Lock size={14} />
              Безопасная оплата
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">Оплата банковской картой</h1>
            <p className="mt-3 text-white/80">
              {booking.tourTitle} · {formatPrice(payment.amount)}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            {formError ? (
              <div
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="cardNumber" className="text-sm font-medium text-slate-700">
                  Номер карты
                </label>
                <input
                  id="cardNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={formatCardNumberDisplay(values.cardNumber)}
                  onChange={(event) =>
                    setFieldValue("cardNumber", sanitizeCardNumberInput(event.target.value))
                  }
                  onBlur={() => markTouched("cardNumber")}
                  placeholder="1234 5678 9012 3456"
                  className={getInputClassName(Boolean(getVisibleError("cardNumber")))}
                  aria-invalid={Boolean(getVisibleError("cardNumber"))}
                  aria-describedby={
                    getVisibleError("cardNumber") ? "cardNumber-error" : undefined
                  }
                />
                {getVisibleError("cardNumber") ? (
                  <p id="cardNumber-error" className="mt-1 text-sm text-red-600" role="alert">
                    {getVisibleError("cardNumber")}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    Только цифры, 13–19 символов. Проверяется по алгоритму Луна.
                  </p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="expiry" className="text-sm font-medium text-slate-700">
                    Срок действия
                  </label>
                  <input
                    id="expiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={values.expiry}
                    onChange={(event) =>
                      setFieldValue("expiry", sanitizeExpiryInput(event.target.value))
                    }
                    onBlur={() => markTouched("expiry")}
                    placeholder="ММ/ГГ"
                    maxLength={5}
                    className={getInputClassName(Boolean(getVisibleError("expiry")))}
                    aria-invalid={Boolean(getVisibleError("expiry"))}
                    aria-describedby={getVisibleError("expiry") ? "expiry-error" : undefined}
                  />
                  {getVisibleError("expiry") ? (
                    <p id="expiry-error" className="mt-1 text-sm text-red-600" role="alert">
                      {getVisibleError("expiry")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Формат: ММ/ГГ, не раньше текущего месяца.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cvc" className="text-sm font-medium text-slate-700">
                    CVC / CVV
                  </label>
                  <input
                    id="cvc"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={values.cvc}
                    onChange={(event) =>
                      setFieldValue("cvc", sanitizeCvcInput(event.target.value, cardDigits))
                    }
                    onBlur={() => markTouched("cvc")}
                    placeholder="123"
                    maxLength={4}
                    className={getInputClassName(Boolean(getVisibleError("cvc")))}
                    aria-invalid={Boolean(getVisibleError("cvc"))}
                    aria-describedby={getVisibleError("cvc") ? "cvc-error" : undefined}
                  />
                  {getVisibleError("cvc") ? (
                    <p id="cvc-error" className="mt-1 text-sm text-red-600" role="alert">
                      {getVisibleError("cvc")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">3 цифры, для American Express — 4.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                    Имя держателя
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="cc-given-name"
                    value={values.firstName}
                    onChange={(event) =>
                      setFieldValue("firstName", sanitizeCardFirstNameInput(event.target.value))
                    }
                    onBlur={() => markTouched("firstName")}
                    placeholder="Иван"
                    className={getInputClassName(Boolean(getVisibleError("firstName")))}
                    aria-invalid={Boolean(getVisibleError("firstName"))}
                    aria-describedby={
                      getVisibleError("firstName") ? "firstName-error" : undefined
                    }
                  />
                  {getVisibleError("firstName") ? (
                    <p id="firstName-error" className="mt-1 text-sm text-red-600" role="alert">
                      {getVisibleError("firstName")}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                    Фамилия держателя
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="cc-family-name"
                    value={values.lastName}
                    onChange={(event) =>
                      setFieldValue("lastName", sanitizeCardLastNameInput(event.target.value))
                    }
                    onBlur={() => markTouched("lastName")}
                    placeholder="Иванов"
                    className={getInputClassName(Boolean(getVisibleError("lastName")))}
                    aria-invalid={Boolean(getVisibleError("lastName"))}
                    aria-describedby={getVisibleError("lastName") ? "lastName-error" : undefined}
                  />
                  {getVisibleError("lastName") ? (
                    <p id="lastName-error" className="mt-1 text-sm text-red-600" role="alert">
                      {getVisibleError("lastName")}
                    </p>
                  ) : null}
                </div>
              </div>

              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Данные карты проверяются на стороне браузера: номер, срок, CVC и имя держателя.
                Номер карты не сохраняется — используется только для подтверждения оплаты.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={18} />
                  {isSubmitting ? "Проводим оплату..." : `Оплатить ${formatPrice(payment.amount)}`}
                </button>
                <Link
                  to="/bookings"
                  className="inline-flex items-center rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Отмена
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </>
  );
}
