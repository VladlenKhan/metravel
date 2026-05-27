import { BadgePlus, PencilLine, RefreshCw, Save, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
  type ClientProfile,
  type ClientUpsertPayload,
  type UserRole,
} from "../../api/api";
import {
  FIELD_LIMITS,
  sanitizeEmailInput,
  sanitizePassportInput,
  sanitizePersonNameInput,
  sanitizePhoneInput,
} from "../../lib/formSanitizers";
import { useAuthSession } from "../../hooks/useAuthSession";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type ClientFormState = {
  id: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  passportNumber: string;
  isRegular: boolean;
};

function createInitialClientForm(): ClientFormState {
  return {
    id: null,
    fullName: "",
    email: "",
    phoneNumber: "",
    passportNumber: "",
    isRegular: false,
  };
}

function sortClients(clients: ClientProfile[]): ClientProfile[] {
  return [...clients].sort((left, right) => left.fullName.localeCompare(right.fullName, "ru"));
}

function toPayload(form: ClientFormState): ClientUpsertPayload {
  return {
    fullName: sanitizePersonNameInput(form.fullName, FIELD_LIMITS.fullName).trim(),
    email: sanitizeEmailInput(form.email).trim(),
    phoneNumber: sanitizePhoneInput(form.phoneNumber).trim(),
    passportNumber: sanitizePassportInput(form.passportNumber).trim(),
    isRegular: form.isRegular,
  };
}

function toClientProfile(form: ClientFormState): ClientProfile {
  return {
    id: form.id ?? "",
    fullName: sanitizePersonNameInput(form.fullName, FIELD_LIMITS.fullName).trim(),
    email: sanitizeEmailInput(form.email).trim(),
    phoneNumber: sanitizePhoneInput(form.phoneNumber).trim(),
    passportNumber: sanitizePassportInput(form.passportNumber).trim(),
    isRegular: form.isRegular,
  };
}

function getRoleMeta(role: UserRole): { label: string; badgeClassName: string } {
  switch (role) {
    case "Admin":
      return {
        label: "Админ",
        badgeClassName: "bg-red-100 text-red-700",
      };
    case "Operator":
      return {
        label: "Менеджер",
        badgeClassName: "bg-amber-100 text-amber-700",
      };
    case "Client":
    default:
      return {
        label: "Клиент",
        badgeClassName: "bg-sky-100 text-sky-700",
      };
  }
}

export default function ClientsSection() {
  const session = useAuthSession();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [form, setForm] = useState<ClientFormState>(createInitialClientForm);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [error, setError] = useState("");
  const currentSessionEmail = session?.email.trim().toLowerCase() ?? "";
  const currentSessionClientCard =
    clients.find((client) => client.email.trim().toLowerCase() === currentSessionEmail) ?? null;
  const otherClients = clients.filter(
    (client) => client.email.trim().toLowerCase() !== currentSessionEmail
  );
  const shouldScrollClients = otherClients.length > 3;
  const roleMeta = session ? getRoleMeta(session.role) : null;

  const loadClients = async () => {
    setError("");

    try {
      const nextClients = await fetchClients();
      setClients(sortClients(nextClients));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Не удалось загрузить карточки клиентов."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const resetForm = () => setForm(createInitialClientForm());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (form.id) {
        const updatedClient = await updateClient(form.id, toClientProfile(form));
        setClients((currentClients) =>
          sortClients(
            currentClients.map((client) => (client.id === updatedClient.id ? updatedClient : client))
          )
        );
        setFeedback({
          type: "success",
          message: "Карточка клиента обновлена.",
        });
      } else {
        const createdClient = await createClient(toPayload(form));
        setClients((currentClients) => sortClients([createdClient, ...currentClients]));
        setFeedback({
          type: "success",
          message: "Новый клиент добавлен.",
        });
      }

      resetForm();
    } catch (submitError) {
      setFeedback({
        type: "error",
        message:
          submitError instanceof Error ? submitError.message : "Не удалось сохранить клиента.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (client: ClientProfile) => {
    if (client.email.trim().toLowerCase() === currentSessionEmail) {
      setFeedback({
        type: "error",
        message: "Нельзя удалить клиентскую карточку, которая связана с вашим текущим аккаунтом.",
      });
      return;
    }

    const confirmed = window.confirm(`Удалить карточку клиента «${client.fullName}»?`);
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingClientId(client.id);

    try {
      await deleteClient(client.id);
      setClients((currentClients) =>
        sortClients(currentClients.filter((currentClient) => currentClient.id !== client.id))
      );

      if (form.id === client.id) {
        resetForm();
      }

      setFeedback({
        type: "success",
        message: "Карточка клиента удалена.",
      });
    } catch (deleteError) {
      setFeedback({
        type: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Не удалось удалить карточку клиента.",
      });
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[0.95fr_1.35fr]">
      <div className="h-fit rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
            <UserRound size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {form.id ? "Редактирование клиента" : "Новый клиент"}
            </h2>
            <p className="text-sm text-slate-500">
              Карточки клиентов помогают менеджеру быстро работать с данными путешественников.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm text-slate-500">Имя и фамилия</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fullName: sanitizePersonNameInput(
                    event.target.value,
                    FIELD_LIMITS.fullName
                  ),
                }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Анна Петрова"
              required
              minLength={2}
              maxLength={FIELD_LIMITS.fullName}
              autoComplete="name"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-500">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: sanitizeEmailInput(event.target.value),
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="client@example.com"
                required
                maxLength={FIELD_LIMITS.email}
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm text-slate-500">Телефон</label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phoneNumber: sanitizePhoneInput(event.target.value),
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="+7 999 123-45-67"
                required
                minLength={6}
                maxLength={FIELD_LIMITS.phone}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-500">Паспортные данные</label>
            <input
              type="text"
              value={form.passportNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  passportNumber: sanitizePassportInput(event.target.value),
                }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="1234 567890"
              required
              minLength={5}
              maxLength={FIELD_LIMITS.passport}
              autoComplete="off"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isRegular}
              onChange={(event) =>
                setForm((current) => ({ ...current, isRegular: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-400"
            />
            Постоянный клиент
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
            >
              {isSaving ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : form.id ? (
                <Save size={18} />
              ) : (
                <BadgePlus size={18} />
              )}
              {isSaving
                ? "Сохраняем..."
                : form.id
                  ? "Сохранить изменения"
                  : "Добавить клиента"}
            </button>

            {form.id ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Отменить
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">База клиентов</h2>
            <p className="text-sm text-slate-500">
              Отдельный список клиентов без смешивания с административными аккаунтами.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadClients();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Обновить
          </button>
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

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            Пока нет карточек клиентов.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {currentSessionClientCard ? (
              <section className="rounded-[24px] border border-sky-200 bg-sky-50/70 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Ваш аккаунт</h3>
                    <p className="text-sm text-slate-500">
                      Эта карточка связана с вашей текущей учетной записью.
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Активная сессия
                  </span>
                </div>

                <div className="rounded-[20px] border border-sky-100 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-slate-900">
                          {currentSessionClientCard.fullName}
                        </h4>
                        {roleMeta ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleMeta.badgeClassName}`}
                          >
                            {roleMeta.label}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            currentSessionClientCard.isRegular
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {currentSessionClientCard.isRegular ? "Постоянный клиент" : "Новый клиент"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-50 px-3 py-1">
                          {currentSessionClientCard.email}
                        </span>
                        <span className="rounded-full bg-slate-50 px-3 py-1">
                          {currentSessionClientCard.phoneNumber}
                        </span>
                        <span className="rounded-full bg-slate-50 px-3 py-1">
                          {currentSessionClientCard.passportNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-nowrap items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => setForm({ ...currentSessionClientCard, id: currentSessionClientCard.id })}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        <PencilLine size={16} />
                        Изменить карточку
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Остальные клиенты</h3>
                  <p className="text-sm text-slate-500">
                    Отдельные карточки путешественников, не связанные с вашей текущей сессией.
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {otherClients.length}
                </span>
              </div>

              {otherClients.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500">
                  Остальных клиентских карточек пока нет.
                </div>
              ) : (
                <div
                  className={`space-y-4 ${
                    shouldScrollClients ? "max-h-[620px] overflow-y-auto pr-2" : ""
                  }`}
                >
                  {otherClients.map((client) => (
                    <article
                      key={client.id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{client.fullName}</h3>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                client.isRegular
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {client.isRegular ? "Постоянный клиент" : "Новый клиент"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-white px-3 py-1">{client.email}</span>
                            <span className="rounded-full bg-white px-3 py-1">{client.phoneNumber}</span>
                            <span className="rounded-full bg-white px-3 py-1">
                              {client.passportNumber}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-nowrap items-center gap-2 self-start">
                          <button
                            type="button"
                            onClick={() => setForm({ ...client, id: client.id })}
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                          >
                            <PencilLine size={16} />
                            Изменить
                          </button>
                          <button
                            type="button"
                            disabled={deletingClientId === client.id}
                            onClick={() => void handleDelete(client)}
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-rose-50 px-3.5 py-2 text-[13px] font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingClientId === client.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Удалить карточку
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
