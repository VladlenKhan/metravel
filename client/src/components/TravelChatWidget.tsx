import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CalendarDays,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Send,
  Wallet,
  X,
} from "lucide-react";
import {
  fetchTours,
  predictRecommendations,
  type RecommendationRequestPayload,
  type Tour,
  type TourRecommendation,
  type UserRole,
} from "../api/api";
import { Link } from "react-router-dom";
import { useAuthSession } from "../hooks/useAuthSession";

type ChatStep = "country" | "city" | "budget" | "duration" | "month" | "results";
type ChatRole = "assistant" | "user";
type MessageTone = "default" | "error" | "success";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  tone?: MessageTone;
  recommendations?: TourRecommendation[];
  actions?: ChatAction[];
};

type QuickReply = {
  label: string;
  value: string;
};

type ChatAction = {
  label: string;
  to: string;
};

type RecommendationDraft = {
  country: string;
  city: string;
  budget: string;
  desiredDurationDays: string;
  preferredMonth: string;
};

const FALLBACK_COUNTRIES = ["Турция", "Италия", "ОАЭ", "Египет"];
const FALLBACK_CITIES = ["Стамбул", "Дубай", "Рим", "Анталья"];
const TRAVEL_CHAT_OPEN_EVENT = "metravel-open-travel-chat";
const BUDGET_OPTIONS: QuickReply[] = [
  { label: "До 100 000", value: "100000" },
  { label: "До 150 000", value: "150000" },
  { label: "До 250 000", value: "250000" },
  { label: "Пропустить", value: "skip" },
];
const DURATION_OPTIONS: QuickReply[] = [
  { label: "3 дня", value: "3" },
  { label: "5 дней", value: "5" },
  { label: "7 дней", value: "7" },
  { label: "Пропустить", value: "skip" },
];
const MONTH_OPTIONS: QuickReply[] = [
  { label: "Июнь", value: "6" },
  { label: "Июль", value: "7" },
  { label: "Август", value: "8" },
  { label: "Пропустить", value: "skip" },
];

function createInitialDraft(): RecommendationDraft {
  return {
    country: "",
    city: "",
    budget: "",
    desiredDurationDays: "",
    preferredMonth: "",
  };
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createMessage(
  role: ChatRole,
  text: string,
  tone: MessageTone = "default",
  recommendations?: TourRecommendation[],
  actions?: ChatAction[]
): ChatMessage {
  return {
    id: createMessageId(),
    role,
    text,
    tone,
    recommendations,
    actions,
  };
}

function normalizeLabel(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function isPlaceholderValue(value: string): boolean {
  const normalizedValue = value.trim().toLowerCase();
  return (
    normalizedValue.length === 0 ||
    normalizedValue === "город уточняется" ||
    normalizedValue === "направление уточняется"
  );
}

function getUniqueValues(values: string[], max = 4): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalizedValue = normalizeLabel(value);
    const key = normalizedValue.toLowerCase();

    if (isPlaceholderValue(normalizedValue) || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(normalizedValue);
  });

  return result.slice(0, max);
}

function isSkipIntent(value: string): boolean {
  const normalizedValue = value.trim().toLowerCase();
  return (
    normalizedValue === "skip" ||
    normalizedValue === "пропустить" ||
    normalizedValue === "не важно" ||
    normalizedValue === "без разницы" ||
    normalizedValue === "любой" ||
    normalizedValue === "нет"
  );
}

function isRestartIntent(value: string): boolean {
  const normalizedValue = value.trim().toLowerCase();
  return (
    normalizedValue === "заново" ||
    normalizedValue === "сначала" ||
    normalizedValue === "начать заново" ||
    normalizedValue === "подобрать заново"
  );
}

function parsePositiveNumber(value: string): number | null {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }

  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseMonthValue(value: string): number | null {
  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  const numericMonth = Number(normalizedValue.replace(/[^\d]/g, ""));
  if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return numericMonth;
  }

  const monthMap: Record<string, number> = {
    январь: 1,
    января: 1,
    февраль: 2,
    февраля: 2,
    март: 3,
    марта: 3,
    апрель: 4,
    апреля: 4,
    май: 5,
    мая: 5,
    июнь: 6,
    июня: 6,
    июль: 7,
    июля: 7,
    август: 8,
    августа: 8,
    сентябрь: 9,
    сентября: 9,
    октябрь: 10,
    октября: 10,
    ноябрь: 11,
    ноября: 11,
    декабрь: 12,
    декабря: 12,
  };

  return monthMap[normalizedValue] ?? null;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return "Даты уточняются";
  }

  return `${start.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  })} - ${end.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  })}`;
}

function formatMonthLabel(value: string): string {
  const parsedMonth = parseMonthValue(value);
  if (!parsedMonth) {
    return value;
  }

  return new Date(2026, parsedMonth - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
  });
}

function getTourDurationDays(tour: Tour): number {
  const start = new Date(tour.startDate);
  const end = new Date(tour.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const differenceInDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(1, differenceInDays + 1);
}

function syncRecommendationsWithCatalog(
  recommendations: TourRecommendation[],
  catalogTours: Tour[]
): TourRecommendation[] {
  if (catalogTours.length === 0) {
    return [];
  }

  const toursById = new Map(catalogTours.map((tour) => [tour.id, tour]));

  return recommendations.flatMap((recommendation) => {
    const matchedTour = toursById.get(recommendation.tourId);
    if (!matchedTour) {
      return [];
    }

    return {
      ...recommendation,
      title: matchedTour.title,
      country: matchedTour.country,
      city: matchedTour.city,
      startDate: matchedTour.startDate,
      endDate: matchedTour.endDate,
      basePrice: matchedTour.basePrice,
      durationDays: getTourDurationDays(matchedTour),
    };
  });
}

function getNavigationReply(
  value: string,
  sessionRole: UserRole | null
): { text: string; actions: ChatAction[] } | null {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue.includes("регист") ||
    normalizedValue.includes("вход") ||
    normalizedValue.includes("войти") ||
    normalizedValue.includes("аккаунт")
  ) {
    return {
      text:
        sessionRole
          ? "Вы уже вошли в систему. Если нужно, могу быстро открыть профиль или каталог туров."
          : "Для начала можно создать аккаунт или сразу войти, если он уже есть.",
      actions: sessionRole
        ? [
            { label: "Профиль", to: "/profile" },
            { label: "Каталог туров", to: "/tours" },
          ]
        : [
            { label: "Регистрация", to: "/register" },
            { label: "Вход", to: "/login" },
          ],
    };
  }

  if (
    normalizedValue.includes("тур") ||
    normalizedValue.includes("каталог") ||
    normalizedValue.includes("направлен")
  ) {
    return {
      text: "Открою каталог туров. Там можно смотреть карточки, фильтровать направления и отправлять заявки на бронирование.",
      actions: [{ label: "Открыть туры", to: "/tours" }],
    };
  }

  if (
    normalizedValue.includes("брон") ||
    normalizedValue.includes("заявк") ||
    normalizedValue.includes("статус")
  ) {
    if (sessionRole === "Client") {
      return {
        text: "Статусы клиентских заявок собраны в отдельном разделе личного кабинета.",
        actions: [{ label: "Мои бронирования", to: "/bookings" }],
      };
    }

    if (sessionRole === "Admin" || sessionRole === "Operator") {
      return {
        text: "Заявки и их статусы находятся в рабочей панели сотрудников.",
        actions: [{ label: "Открыть панель", to: "/admin" }],
      };
    }
  }

  if (
    normalizedValue.includes("профил") ||
    normalizedValue.includes("паспорт") ||
    normalizedValue.includes("телефон")
  ) {
    return {
      text:
        sessionRole === "Client"
          ? "В профиле можно дозаполнить телефон и паспортные данные, чтобы открыть бронирование."
          : "Личный профиль клиента доступен после входа под ролью Client.",
      actions:
        sessionRole === "Client"
          ? [{ label: "Открыть профиль", to: "/profile" }]
          : !sessionRole
            ? [{ label: "Войти", to: "/login" }]
            : [{ label: "Каталог туров", to: "/tours" }],
    };
  }

  if (
    normalizedValue.includes("контакт") ||
    normalizedValue.includes("связ") ||
    normalizedValue.includes("менеджер")
  ) {
    return {
      text: "Контакты и способы связи находятся на главной странице. Там же можно перейти к разделу о компании.",
      actions: [
        { label: "Контакты", to: "/#contacts" },
        { label: "О нас", to: "/#about" },
      ],
    };
  }

  if (
    normalizedValue.includes("админ") ||
    normalizedValue.includes("панель") ||
    normalizedValue.includes("клиент") ||
    normalizedValue.includes("оплат")
  ) {
    if (sessionRole === "Admin" || sessionRole === "Operator") {
      return {
        text: "Рабочие разделы сотрудников находятся в панели: там есть заявки, оплаты, клиенты и каталог туров.",
        actions: [{ label: "Открыть панель", to: "/admin" }],
      };
    }
  }

  return null;
}

function buildRecommendationPayload(draft: RecommendationDraft): RecommendationRequestPayload | null {
  const payload: RecommendationRequestPayload = {
    top: 3,
  };

  const normalizedCountry = draft.country.trim();
  const normalizedCity = draft.city.trim();
  const budget = parsePositiveNumber(draft.budget);
  const duration = parsePositiveNumber(draft.desiredDurationDays);
  const preferredMonth = parseMonthValue(draft.preferredMonth);

  if (normalizedCountry) {
    payload.country = normalizedCountry;
  }

  if (normalizedCity) {
    payload.city = normalizedCity;
  }

  if (budget) {
    payload.budget = budget;
  }

  if (duration) {
    payload.desiredDurationDays = duration;
  }

  if (preferredMonth) {
    payload.preferredMonth = preferredMonth;
  }

  return payload.country ||
    payload.city ||
    payload.budget ||
    payload.desiredDurationDays ||
    payload.preferredMonth
    ? payload
    : null;
}

function getPromptText(step: ChatStep, draft: RecommendationDraft): string {
  switch (step) {
    case "country":
      return "С какой страны начнем? Напишите направление или выберите быстрый вариант ниже.";
    case "city":
      return draft.country
        ? `Отлично, смотрим ${draft.country}. Нужен конкретный город или оставим выбор шире?`
        : "Есть ли предпочтение по городу? Если нет, можно пропустить этот шаг.";
    case "budget":
      return "Какой у вас ориентир по бюджету на одного человека? Можно просто написать сумму в рублях.";
    case "duration":
      return "На сколько дней хотите поехать? Достаточно просто числа.";
    case "month":
      return "Есть любимый месяц для поездки? Напишите месяц словами или выберите ниже.";
    case "results":
      return "Сейчас подберу варианты по вашим пожеланиям.";
    default:
      return "";
  }
}

export default function TravelChatWidget() {
  const session = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [step, setStep] = useState<ChatStep>("country");
  const [draft, setDraft] = useState<RecommendationDraft>(createInitialDraft);
  const [catalogTours, setCatalogTours] = useState<Tour[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadCatalogTours = async (): Promise<Tour[]> => {
    try {
      const tours = await fetchTours();
      setCatalogTours(tours);
      return tours;
    } catch {
      setCatalogTours([]);
      return [];
    }
  };

  useEffect(() => {
    void loadCatalogTours();
  }, []);

  useEffect(() => {
    if (!isOpen || messages.length > 0) {
      return;
    }

    startConversation();
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    const handleOpenRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ restart?: boolean }>;
      setIsOpen(true);

      if (customEvent.detail?.restart) {
        startConversation();
      }
    };

    window.addEventListener(TRAVEL_CHAT_OPEN_EVENT, handleOpenRequest as EventListener);
    return () =>
      window.removeEventListener(TRAVEL_CHAT_OPEN_EVENT, handleOpenRequest as EventListener);
  }, []);

  const appendMessage = (message: ChatMessage) => {
    setMessages((currentMessages) => [...currentMessages, message]);
  };

  const appendAssistantPrompt = (nextStep: Exclude<ChatStep, "results">, nextDraft: RecommendationDraft) => {
    appendMessage(createMessage("assistant", getPromptText(nextStep, nextDraft)));
  };

  const startConversation = () => {
    const nextDraft = createInitialDraft();
    setDraft(nextDraft);
    setStep("country");
    setInputValue("");
    setIsThinking(false);
      setMessages([
      createMessage(
        "assistant",
        "Я ваш чат-бот. Помогу подобрать тур, а еще подскажу, где на сайте находятся профиль, бронирования, контакты и рабочие разделы."
      ),
      createMessage("assistant", getPromptText("country", nextDraft)),
    ]);
  };

  const quickReplies: QuickReply[] = (() => {
    if (step === "results") {
      return [];
    }

    if (step === "country") {
      const countries = getUniqueValues(
        catalogTours.map((tour) => tour.country),
        4
      );

      return [...(countries.length > 0 ? countries : FALLBACK_COUNTRIES).map((country) => ({
        label: country,
        value: country,
      }))];
    }

    if (step === "city") {
      const normalizedCountry = draft.country.trim().toLowerCase();
      const cityPool = normalizedCountry
        ? catalogTours
            .filter((tour) => tour.country.trim().toLowerCase() === normalizedCountry)
            .map((tour) => tour.city)
        : catalogTours.map((tour) => tour.city);

      const cities = getUniqueValues(cityPool, 4);

      return [
        ...(cities.length > 0 ? cities : FALLBACK_CITIES).map((city) => ({
          label: city,
          value: city,
        })),
        { label: "Пропустить", value: "skip" },
      ];
    }

    if (step === "budget") {
      return BUDGET_OPTIONS;
    }

    if (step === "duration") {
      return DURATION_OPTIONS;
    }

    return MONTH_OPTIONS;
  })();

  const inputPlaceholder =
    step === "country"
      ? "Например: Турция"
      : step === "city"
        ? "Например: Стамбул"
        : step === "budget"
          ? "Например: 150000"
          : step === "duration"
            ? "Например: 5"
            : step === "month"
              ? "Например: июнь"
              : "Напишите «заново», чтобы начать новый подбор";

  const handleRecommendationSearch = async (nextDraft: RecommendationDraft) => {
    const payload = buildRecommendationPayload(nextDraft);

    if (!payload) {
      setStep("country");
      appendMessage(
        createMessage(
          "assistant",
          "Чтобы подобрать тур, нужен хотя бы один ориентир: страна, город, бюджет, длительность или месяц."
        )
      );
      appendAssistantPrompt("country", nextDraft);
      return;
    }

    setStep("results");
    setIsThinking(true);
    appendMessage(createMessage("assistant", "Подбираю лучшие варианты, это займет пару секунд..."));

    try {
      const latestCatalogTours = await loadCatalogTours();

      if (latestCatalogTours.length === 0) {
        appendMessage(
          createMessage(
            "assistant",
            "Сейчас в каталоге нет доступных туров. Как только администратор добавит новые направления, я сразу смогу их подобрать.",
            "error"
          )
        );
        return;
      }

      const recommendations = await predictRecommendations(payload);
      const visibleRecommendations = syncRecommendationsWithCatalog(
        recommendations,
        latestCatalogTours
      );

      if (visibleRecommendations.length === 0) {
        appendMessage(
          createMessage(
            "assistant",
            recommendations.length > 0
              ? "Модель вернула устаревшие варианты, которых уже нет в текущем каталоге. Попробуйте другой запрос или дождитесь обновления каталога."
              : "Пока не нашел точных совпадений. Попробуйте расширить бюджет, убрать город или выбрать другой месяц."
          )
        );
        return;
      }

      appendMessage(
        createMessage(
          "assistant",
          "Вот что сейчас выглядит наиболее подходящим по вашим пожеланиям.",
          "success",
          visibleRecommendations
        )
      );
    } catch (error) {
      appendMessage(
        createMessage(
          "assistant",
          error instanceof Error
            ? error.message
            : "Не удалось получить рекомендации прямо сейчас.",
          "error"
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleAnswer = async (rawValue: string) => {
    if (isThinking) {
      return;
    }

    const answer = rawValue.trim();
    if (!answer) {
      return;
    }

    if (isRestartIntent(answer)) {
      startConversation();
      return;
    }

    const navigationReply = getNavigationReply(answer, session?.role ?? null);
    if (navigationReply) {
      appendMessage(createMessage("user", answer));
      setInputValue("");
      appendMessage(
        createMessage("assistant", navigationReply.text, "default", undefined, navigationReply.actions)
      );
      return;
    }

    if (step === "results") {
      appendMessage(createMessage("user", answer));
      setInputValue("");
      appendMessage(
        createMessage(
          "assistant",
          "Если хотите новый подбор, нажмите «Подобрать заново» внизу окна."
        )
      );
      return;
    }

    appendMessage(createMessage("user", answer));
    setInputValue("");

    if (step === "country") {
      const nextDraft = {
        ...draft,
        country: isSkipIntent(answer) ? "" : normalizeLabel(answer),
      };

      setDraft(nextDraft);
      setStep("city");
      appendAssistantPrompt("city", nextDraft);
      return;
    }

    if (step === "city") {
      const nextDraft = {
        ...draft,
        city: isSkipIntent(answer) ? "" : normalizeLabel(answer),
      };

      setDraft(nextDraft);
      setStep("budget");
      appendAssistantPrompt("budget", nextDraft);
      return;
    }

    if (step === "budget") {
      if (!isSkipIntent(answer) && !parsePositiveNumber(answer)) {
        appendMessage(
          createMessage(
            "assistant",
            "Бюджет лучше указать числом, например `150000`. Или нажмите «Пропустить».",
            "error"
          )
        );
        return;
      }

      const nextDraft = {
        ...draft,
        budget: isSkipIntent(answer) ? "" : answer,
      };

      setDraft(nextDraft);
      setStep("duration");
      appendAssistantPrompt("duration", nextDraft);
      return;
    }

    if (step === "duration") {
      if (!isSkipIntent(answer) && !parsePositiveNumber(answer)) {
        appendMessage(
          createMessage(
            "assistant",
            "Подскажите длительность числом, например `5`. Или пропустите этот шаг.",
            "error"
          )
        );
        return;
      }

      const nextDraft = {
        ...draft,
        desiredDurationDays: isSkipIntent(answer) ? "" : answer,
      };

      setDraft(nextDraft);
      setStep("month");
      appendAssistantPrompt("month", nextDraft);
      return;
    }

    if (!isSkipIntent(answer) && !parseMonthValue(answer)) {
      appendMessage(
        createMessage(
          "assistant",
          "Месяц можно написать словами, например `июнь`, или числом от 1 до 12.",
          "error"
        )
      );
      return;
    }

    const nextDraft = {
      ...draft,
      preferredMonth: isSkipIntent(answer) ? "" : answer,
    };

    setDraft(nextDraft);
    await handleRecommendationSearch(nextDraft);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleAnswer(inputValue);
  };

  const hasResults = messages.some(
    (message) => Array.isArray(message.recommendations) && message.recommendations.length > 0
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Открыть чат-бота"
        className="fixed bottom-4 left-4 z-30 flex h-14 items-center gap-3 rounded-full bg-slate-950 px-4 text-white shadow-[0_20px_50px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 hover:bg-slate-900 sm:bottom-6 sm:left-6"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <MessageCircle size={20} />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-none">Чат-бот</span>
          <span className="mt-1 block text-xs text-white/70">Подобрать тур</span>
        </span>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute inset-x-4 bottom-4 max-h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.3)] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[420px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_48%,#f59e0b_100%)] px-5 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    <Bot size={14} />
                    ИИ помощник
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold">Подбор тура в формате чата</h2>
                  <p className="mt-2 text-sm text-white/80">
                    Бот задаст несколько коротких вопросов и подберет варианты через текущую модель рекомендаций.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
                  aria-label="Закрыть окно"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex h-[min(68vh,640px)] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eefbf9_100%)] px-4 py-4 sm:px-5">
                {messages.map((message) => {
                  const isAssistant = message.role === "assistant";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-[24px] px-4 py-3 shadow-sm ${
                          isAssistant
                            ? message.tone === "error"
                              ? "border border-red-200 bg-red-50 text-red-700"
                              : message.tone === "success"
                                ? "border border-emerald-200 bg-white text-slate-800"
                                : "border border-slate-200 bg-white text-slate-800"
                            : "bg-slate-900 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-line text-sm leading-6">{message.text}</p>

                        {message.recommendations?.length ? (
                          <div className="mt-4 space-y-3">
                            {message.recommendations.map((recommendation) => (
                              <div
                                key={recommendation.tourId}
                                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="text-base font-semibold text-slate-900">
                                      {recommendation.title}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                                        <MapPin size={12} />
                                        {recommendation.city}, {recommendation.country}
                                      </span>
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                                        <CalendarDays size={12} />
                                        {formatDateRange(recommendation.startDate, recommendation.endDate)}
                                      </span>
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                                        <Wallet size={12} />
                                        от {formatPrice(recommendation.basePrice)} ₽
                                      </span>
                                    </div>
                                  </div>

                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {recommendation.durationDays} дн.
                                  </span>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                  {recommendation.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {message.actions?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {message.actions.map((action) => (
                              <Link
                                key={`${message.id}-${action.to}-${action.label}`}
                                to={action.to}
                                onClick={() => setIsOpen(false)}
                                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                              >
                                {action.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {isThinking ? (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                      <LoaderCircle size={16} className="animate-spin" />
                      Думаю над лучшими вариантами...
                    </div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              {quickReplies.length > 0 ? (
                <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply) => (
                      <button
                        key={`${step}-${reply.label}-${reply.value}`}
                        type="button"
                        onClick={() => void handleAnswer(reply.value)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label htmlFor="travel-chat-input" className="sr-only">
                      Сообщение для чат-бота
                    </label>
                    <textarea
                      id="travel-chat-input"
                      rows={1}
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      placeholder={inputPlaceholder}
                      disabled={isThinking}
                      className="min-h-[52px] w-full resize-none rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isThinking || inputValue.trim().length === 0}
                    className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    aria-label="Отправить сообщение"
                  >
                    <Send size={18} />
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startConversation}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    Подобрать заново
                  </button>
                  <Link
                    to="/tours"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    Каталог
                  </Link>
                  {session?.role === "Client" ? (
                    <Link
                      to="/bookings"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      Мои бронирования
                    </Link>
                  ) : null}
                  {session?.role === "Admin" || session?.role === "Operator" ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      Панель
                    </Link>
                  ) : null}
                  {hasResults ? (
                    <Link
                      to="/tours"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
                    >
                      Открыть каталог туров
                    </Link>
                  ) : null}
                </div>

                <div className="mt-3 text-xs leading-5 text-slate-400">
                  {draft.country ? `Страна: ${draft.country}. ` : ""}
                  {draft.city ? `Город: ${draft.city}. ` : ""}
                  {draft.budget ? `Бюджет: до ${formatPrice(parsePositiveNumber(draft.budget) ?? 0)} ₽. ` : ""}
                  {draft.desiredDurationDays ? `Длительность: ${draft.desiredDurationDays} дн. ` : ""}
                  {draft.preferredMonth ? `Месяц: ${formatMonthLabel(draft.preferredMonth)}.` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
