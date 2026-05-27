import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getDisplayPassportNumber,
  getDisplayPhoneNumber,
  updateClient,
} from "../api/api";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import { useClientProfileStatus } from "../hooks/useClientProfileStatus";
import {
  FIELD_LIMITS,
  FIELD_PATTERNS,
  FIELD_TITLES,
  sanitizePassportInput,
  sanitizePhoneInput,
} from "../lib/formSanitizers";

type ProfileLocationState = {
  registrationSuccess?: boolean;
  profileSetupRequired?: boolean;
};

function getClientStatusMeta(isRegular: boolean): {
  label: string;
  badgeClassName: string;
  description: string;
} {
  if (isRegular) {
    return {
      label: "Постоянный клиент",
      badgeClassName: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      description:
        "Для постоянных клиентов действует скидка 10% на все туры. Этот статус назначается сотрудником сервиса.",
    };
  }

  return {
    label: "Новый клиент",
    badgeClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    description:
      "После первых поездок и сопровождения менеджер может перевести вас в статус постоянного клиента.",
  };
}

export default function Profile() {
  const location = useLocation();
  const locationState = location.state as ProfileLocationState | null;
  const { profile, loading, error, isComplete, refresh, sessionRole } = useClientProfileStatus();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPhoneNumber(sanitizePhoneInput(getDisplayPhoneNumber(profile)));
    setPassportNumber(sanitizePassportInput(getDisplayPassportNumber(profile)));
  }, [profile]);

  if (sessionRole && sessionRole !== "Client") {
    return (
      <>
        <section className="mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-12">
            <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
              <h1 className="text-3xl font-bold text-slate-900">Личный кабинет клиента</h1>
              <p className="mt-4 text-slate-600">
                Этот раздел доступен для пользователей с ролью Client.
              </p>
            </div>
          </div>
        </section>
        <Footer />
        <ScrollToTop />
      </>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    if (!profile) {
      setSaveError("Профиль пока не загружен.");
      return;
    }

    setIsSaving(true);

    try {
      const normalizedPhoneNumber = sanitizePhoneInput(phoneNumber).trim();
      const normalizedPassportNumber = sanitizePassportInput(passportNumber).trim();

      await updateClient(profile.id, {
        ...profile,
        phoneNumber: normalizedPhoneNumber,
        passportNumber: normalizedPassportNumber,
      });

      setPhoneNumber(normalizedPhoneNumber);
      setPassportNumber(normalizedPassportNumber);
      setSaveSuccess("Профиль обновлен. Теперь бронирование доступно.");
      refresh();
    } catch (submitError) {
      setSaveError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось сохранить профиль. Попробуйте еще раз."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section className="mt-20 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 rounded-[32px] bg-[linear-gradient(135deg,#10203a_0%,#1d4ed8_50%,#38bdf8_100%)] px-8 py-12 text-white shadow-[0_20px_80px_rgba(15,23,42,0.24)]">
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
              Личный кабинет
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Данные путешественника
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              Здесь можно завершить профиль и открыть доступ к бронированию туров.
            </p>
          </div>

          {locationState?.registrationSuccess ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              Профиль создан. Осталось добавить телефон и паспортные данные, чтобы бронировать туры.
            </div>
          ) : null}

          {!isComplete || locationState?.profileSetupRequired ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Бронирование пока недоступно. Заполните телефон и паспортные данные в профиле.
            </div>
          ) : null}

          {saveSuccess ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {saveSuccess}
            </div>
          ) : null}

          {saveError ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : loading || !profile ? (
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="h-[420px] animate-pulse rounded-[28px] bg-white shadow-sm" />
              <div className="h-[420px] animate-pulse rounded-[28px] bg-white shadow-sm" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                {(() => {
                  const clientStatus = getClientStatusMeta(profile.isRegular);

                  return (
                    <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                      <div className="text-sm text-slate-500">Статус клиента</div>
                      <div
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${clientStatus.badgeClassName}`}
                      >
                        {clientStatus.label}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {clientStatus.description}
                      </p>
                    </div>
                  );
                })()}

                <h2 className="text-2xl font-bold text-slate-900">Основная информация</h2>
                <div className="mt-6 space-y-5">
                  <div>
                    <label className="text-sm text-slate-500">Имя и фамилия</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      readOnly
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-500">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"
                    />
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
                    После заполнения телефона и паспорта вы сможете бронировать туры прямо из каталога.
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex h-full min-h-[420px] flex-col rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-slate-900">Данные для бронирования</h2>
                <div className="mt-6 flex flex-1 flex-col">
                  <div className="space-y-5">
                  <div>
                    <label className="text-sm text-slate-500">Телефон</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(sanitizePhoneInput(event.target.value))}
                      placeholder="+7 (999) 123-45-67"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      required
                      minLength={FIELD_LIMITS.phone}
                      maxLength={FIELD_LIMITS.phone}
                      pattern={FIELD_PATTERNS.phone}
                      title={FIELD_TITLES.phone}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-500">Паспортные данные</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(event) =>
                        setPassportNumber(sanitizePassportInput(event.target.value))
                      }
                      placeholder="1234 567890"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      required
                      minLength={FIELD_LIMITS.passport}
                      maxLength={FIELD_LIMITS.passport}
                      pattern={FIELD_PATTERNS.passport}
                      title={FIELD_TITLES.passport}
                      autoComplete="off"
                    />
                  </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="mt-auto w-full rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                  >
                    {isSaving ? "Сохраняем..." : "Сохранить профиль"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </>
  );
}
