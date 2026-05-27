import {
  BadgePlus,
  ConciergeBell,
  PencilLine,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Tour } from "../../api/api";
import { useFrontOfficeStore } from "../../hooks/useFrontOfficeStore";
import {
  FIELD_LIMITS,
  FIELD_PATTERNS,
  FIELD_TITLES,
  sanitizeIntegerInput,
  sanitizeMultilineTextInput,
  sanitizeTitleInput,
} from "../../lib/formSanitizers";
import {
  deleteLocalService,
  getLinkedServicesForTour,
  replaceTourServiceLinks,
  saveLocalService,
} from "../../lib/frontOfficeStore";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type ServiceFormState = {
  id: string | null;
  name: string;
  description: string;
  price: string;
};

type TourServiceDraft = {
  serviceId: string;
  enabled: boolean;
  isIncluded: boolean;
  additionalPrice: string;
};

type ServicesSectionProps = {
  tours: Tour[];
};

function createInitialServiceForm(): ServiceFormState {
  return {
    id: null,
    name: "",
    description: "",
    price: "",
  };
}

function sortTours(tours: Tour[]): Tour[] {
  return [...tours].sort((left, right) => left.title.localeCompare(right.title, "ru"));
}

function sortDrafts(drafts: TourServiceDraft[]): TourServiceDraft[] {
  return [...drafts].sort((left, right) => Number(right.enabled) - Number(left.enabled));
}

export default function ServicesSection({ tours }: ServicesSectionProps) {
  const { services, tourServiceLinks } = useFrontOfficeStore();
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(createInitialServiceForm);
  const [selectedTourId, setSelectedTourId] = useState<string>(tours[0]?.id ?? "");
  const [serviceFeedback, setServiceFeedback] = useState<Feedback>(null);
  const [linkFeedback, setLinkFeedback] = useState<Feedback>(null);
  const [tourServiceDrafts, setTourServiceDrafts] = useState<TourServiceDraft[]>([]);

  const sortedTours = useMemo(() => sortTours(tours), [tours]);

  useEffect(() => {
    if (!selectedTourId && sortedTours[0]?.id) {
      setSelectedTourId(sortedTours[0].id);
    }
  }, [selectedTourId, sortedTours]);

  useEffect(() => {
    if (!selectedTourId) {
      setTourServiceDrafts([]);
      return;
    }

    const linkedServices = getLinkedServicesForTour(selectedTourId, services, tourServiceLinks);
    const linkedServicesById = new Map(linkedServices.map((service) => [service.id, service]));

    setTourServiceDrafts(
      sortDrafts(
        services.map((service) => {
          const linkedService = linkedServicesById.get(service.id);

          return {
            serviceId: service.id,
            enabled: Boolean(linkedService),
            isIncluded: linkedService?.isIncluded ?? true,
            additionalPrice: linkedService ? `${linkedService.additionalPrice}` : "0",
          };
        })
      )
    );
  }, [selectedTourId, services, tourServiceLinks]);

  const handleServiceSave = (event: React.FormEvent) => {
    event.preventDefault();
    setServiceFeedback(null);

    const normalizedName = sanitizeTitleInput(serviceForm.name, FIELD_LIMITS.shortText).trim();
    const normalizedDescription = sanitizeMultilineTextInput(
      serviceForm.description,
      FIELD_LIMITS.serviceDescription
    ).trim();
    const normalizedPrice = Number(serviceForm.price);

    if (!normalizedName) {
      setServiceFeedback({
        type: "error",
        message: "Введите название услуги.",
      });
      return;
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      setServiceFeedback({
        type: "error",
        message: "Укажите корректную стоимость услуги.",
      });
      return;
    }

    saveLocalService({
      id: serviceForm.id ?? undefined,
      name: normalizedName,
      description: normalizedDescription,
      price: normalizedPrice,
    });

    setServiceForm(createInitialServiceForm());
    setServiceFeedback({
      type: "success",
      message: serviceForm.id ? "Услуга обновлена." : "Новая услуга добавлена.",
    });
  };

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    const confirmed = window.confirm(`Удалить услугу «${serviceName}»?`);
    if (!confirmed) {
      return;
    }

    deleteLocalService(serviceId);

    if (serviceForm.id === serviceId) {
      setServiceForm(createInitialServiceForm());
    }

    setServiceFeedback({
      type: "success",
      message: "Услуга удалена.",
    });
  };

  const handleSaveTourLinks = () => {
    if (!selectedTourId) {
      setLinkFeedback({
        type: "error",
        message: "Сначала выберите тур.",
      });
      return;
    }

    replaceTourServiceLinks(
      selectedTourId,
      tourServiceDrafts
        .filter((draft) => draft.enabled)
        .map((draft) => ({
          serviceId: draft.serviceId,
          isIncluded: draft.isIncluded,
          additionalPrice: Number(draft.additionalPrice) || 0,
        }))
    );

    setLinkFeedback({
      type: "success",
      message: "Связи услуг с туром сохранены.",
    });
  };

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700">
              <ConciergeBell size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {serviceForm.id ? "Редактирование услуги" : "Новая услуга"}
              </h2>
              <p className="text-sm text-slate-500">
                Соберите собственный набор сервисов: трансфер, страховка, экскурсии и другое.
              </p>
            </div>
          </div>

          <form onSubmit={handleServiceSave} className="mt-8 space-y-4">
            <div>
              <label className="text-sm text-slate-500">Название услуги</label>
              <input
                type="text"
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    name: sanitizeTitleInput(event.target.value, FIELD_LIMITS.shortText),
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                placeholder="Трансфер из аэропорта"
                required
                maxLength={FIELD_LIMITS.shortText}
                pattern={FIELD_PATTERNS.text}
                title={FIELD_TITLES.text}
              />
            </div>

            <div>
              <label className="text-sm text-slate-500">Описание</label>
              <textarea
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    description: sanitizeMultilineTextInput(
                      event.target.value,
                      FIELD_LIMITS.serviceDescription
                    ),
                  }))
                }
                rows={4}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                placeholder="Коротко опишите, что получает путешественник."
                maxLength={FIELD_LIMITS.serviceDescription}
              />
            </div>

            <div>
              <label className="text-sm text-slate-500">Базовая стоимость</label>
              <input
                type="text"
                value={serviceForm.price}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    price: sanitizeIntegerInput(event.target.value, {
                      min: 0,
                      max: FIELD_LIMITS.price,
                    }),
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                placeholder="5000"
                required
                maxLength={String(FIELD_LIMITS.price).length}
                pattern={FIELD_PATTERNS.digits}
                title={FIELD_TITLES.digits}
                inputMode="numeric"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-700"
              >
                {serviceForm.id ? <Save size={18} /> : <BadgePlus size={18} />}
                {serviceForm.id ? "Сохранить услугу" : "Добавить услугу"}
              </button>

              {serviceForm.id ? (
                <button
                  type="button"
                  onClick={() => setServiceForm(createInitialServiceForm())}
                  className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Отменить
                </button>
              ) : null}
            </div>
          </form>

          {serviceFeedback ? (
            <div
              className={`mt-6 rounded-2xl px-5 py-4 text-sm ${
                serviceFeedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {serviceFeedback.message}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Каталог услуг</h2>
              <p className="text-sm text-slate-500">
                Список услуг хранится во фронте и сразу отражается в карточках туров.
              </p>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              Пока нет ни одной услуги.
            </div>
          ) : (
            <div className="mt-6 max-h-[520px] space-y-4 overflow-y-auto pr-2">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {service.description || "Описание можно добавить позже."}
                      </p>
                      <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                        {new Intl.NumberFormat("ru-RU").format(service.price)} ₽
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setServiceForm({
                            id: service.id,
                            name: service.name,
                            description: service.description,
                            price: `${service.price}`,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        <PencilLine size={16} />
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id, service.name)}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                        Удалить
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Услуги внутри тура</h2>
            <p className="text-sm text-slate-500">
              Здесь можно указать, что включено в тур, а что доступно за доплату.
            </p>
          </div>

          <select
            value={selectedTourId}
            onChange={(event) => setSelectedTourId(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          >
            {sortedTours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.title}
              </option>
            ))}
          </select>
        </div>

        {sortedTours.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            Сначала добавьте хотя бы один тур.
          </div>
        ) : services.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            Сначала создайте услуги, чтобы привязать их к выбранному туру.
          </div>
        ) : (
          <>
            {linkFeedback ? (
              <div
                className={`mt-6 rounded-2xl px-5 py-4 text-sm ${
                  linkFeedback.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {linkFeedback.message}
              </div>
            ) : null}

            <div className="mt-6 max-h-[980px] space-y-4 overflow-y-auto pr-2">
              {tourServiceDrafts.map((draft) => {
                const service = services.find((item) => item.id === draft.serviceId);
                if (!service) {
                  return null;
                }

                return (
                  <article
                    key={`${selectedTourId}-${service.id}`}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                            <input
                              type="checkbox"
                              checked={draft.enabled}
                              onChange={(event) =>
                                setTourServiceDrafts((currentDrafts) =>
                                  sortDrafts(
                                    currentDrafts.map((currentDraft) =>
                                      currentDraft.serviceId === draft.serviceId
                                        ? {
                                            ...currentDraft,
                                            enabled: event.target.checked,
                                          }
                                        : currentDraft
                                    )
                                  )
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-400"
                            />
                            {service.name}
                          </label>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {service.description || "Описание можно заполнить позже."}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <span className="mb-2 block text-slate-500">Формат</span>
                          <select
                            value={draft.isIncluded ? "included" : "extra"}
                            disabled={!draft.enabled}
                            onChange={(event) =>
                              setTourServiceDrafts((currentDrafts) =>
                                currentDrafts.map((currentDraft) =>
                                  currentDraft.serviceId === draft.serviceId
                                    ? {
                                        ...currentDraft,
                                        isIncluded: event.target.value === "included",
                                      }
                                    : currentDraft
                                )
                              )
                            }
                            className="w-full bg-transparent focus:outline-none"
                          >
                            <option value="included">Включено в тур</option>
                            <option value="extra">За доплату</option>
                          </select>
                        </label>

                        <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <span className="mb-2 block text-slate-500">Доплата</span>
                          <input
                            type="text"
                            disabled={!draft.enabled || draft.isIncluded}
                            value={draft.additionalPrice}
                            onChange={(event) =>
                              setTourServiceDrafts((currentDrafts) =>
                                currentDrafts.map((currentDraft) =>
                                  currentDraft.serviceId === draft.serviceId
                                    ? {
                                        ...currentDraft,
                                        additionalPrice: sanitizeIntegerInput(
                                          event.target.value,
                                          {
                                            min: 0,
                                            max: FIELD_LIMITS.additionalPrice,
                                          }
                                        ),
                                      }
                                    : currentDraft
                                )
                              )
                            }
                            className="w-full bg-transparent focus:outline-none"
                            maxLength={String(FIELD_LIMITS.additionalPrice).length}
                            pattern={FIELD_PATTERNS.digits}
                            title={FIELD_TITLES.digits}
                            inputMode="numeric"
                          />
                        </label>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveTourLinks}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-700"
            >
              <Save size={18} />
              Сохранить услуги тура
            </button>
          </>
        )}
      </div>
    </div>
  );
}
