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
const DESKTOP_CHAT_HEIGHT = 720;

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

function buildFallbackRecommendations(
  payload: RecommendationRequestPayload,
  catalogTours: Tour[]
): TourRecommendation[] {
  const normalizedCountry = payload.country?.trim().toLowerCase() ?? "";
  const normalizedCity = payload.city?.trim().toLowerCase() ?? "";
  const preferredBudget = typeof payload.budget === "number" ? payload.budget : null;
  const preferredDuration =
    typeof payload.desiredDurationDays === "number" ? payload.desiredDurationDays : null;
  const preferredMonth =
    typeof payload.preferredMonth === "number" ? payload.preferredMonth : null;

  return [...catalogTours]
    .map((tour) => {
      const tourCountry = tour.country.trim().toLowerCase();
      const tourCity = tour.city.trim().toLowerCase();
      const durationDays = getTourDurationDays(tour);
      const startDate = new Date(tour.startDate);
      const startMonth = Number.isNaN(startDate.getTime()) ? null : startDate.getMonth() + 1;
      const explanationParts: string[] = [];
      let score = 0;

      if (normalizedCountry) {
        if (tourCountry === normalizedCountry) {
          score += 4;
          explanationParts.push("совпадает страна");
        } else if (
          tourCountry.includes(normalizedCountry) ||
          normalizedCountry.includes(tourCountry)
        ) {
          score += 2;
          explanationParts.push("страна близка к запросу");
        }
      }

      if (normalizedCity) {
        if (tourCity === normalizedCity) {
          score += 5;
          explanationParts.push("совпадает город");
        } else if (
          tourCity.includes(normalizedCity) ||
          normalizedCity.includes(tourCity)
        ) {
          score += 2;
          explanationParts.push("город близок к запросу");
        }
      }

      if (preferredBudget) {
        if (tour.basePrice <= preferredBudget) {
          score += 3;
          explanationParts.push("подходит по бюджету");
        } else {
          const overflowRatio = (tour.basePrice - preferredBudget) / preferredBudget;
          if (overflowRatio <= 0.15) {
            score += 1;
            explanationParts.push("немного выше бюджета");
          }
        }
      }

      if (preferredDuration) {
        const durationDelta = Math.abs(durationDays - preferredDuration);
        if (durationDelta === 0) {
          score += 3;
          explanationParts.push("идеально подходит по длительности");
        } else if (durationDelta <= 1) {
          score += 2;
          explanationParts.push("близко по длительности");
        } else if (durationDelta <= 3) {
          score += 1;
          explanationParts.push("длительность близка к желаемой");
        }
      }

      if (preferredMonth && startMonth) {
        const monthDelta = Math.abs(startMonth - preferredMonth);
        if (monthDelta === 0) {
          score += 2;
          explanationParts.push("подходит по месяцу поездки");
        } else if (monthDelta === 1) {
          score += 1;
          explanationParts.push("месяц поездки близок к желаемому");
        }
      }

      return {
        tour,
        score,
        explanation:
          explanationParts.length > 0
            ? explanationParts.join(", ")
            : "подобран как ближайший актуальный вариант из каталога",
        durationDays,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.tour.basePrice !== right.tour.basePrice) {
        return left.tour.basePrice - right.tour.basePrice;
      }

      return left.tour.title.localeCompare(right.tour.title, "ru");
    })
    .slice(0, 3)
    .map(({ tour, score, explanation, durationDays }) => ({
      tourId: tour.id,
      title: tour.title,
      country: tour.country,
      city: tour.city,
      startDate: tour.startDate,
      endDate: tour.endDate,
      durationDays,
      basePrice: tour.basePrice,
      score,
      explanation,
    }));
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
        { label: "О нас", to: "/about" },
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
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  }));
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [step, setStep] = useState<ChatStep>("country");
  const [draft, setDraft] = useState<RecommendationDraft>(createInitialDraft);
  const [catalogTours, setCatalogTours] = useState<Tour[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isMobile = viewport.width < 640;

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
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!isOpen || messages.length > 0) {
      return;
    }

    startConversation();
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

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
      const fallbackRecommendations = buildFallbackRecommendations(
        payload,
        latestCatalogTours
      );

      const actualRecommendations =
        visibleRecommendations.length > 0 ? visibleRecommendations : fallbackRecommendations;

      if (actualRecommendations.length === 0) {
        appendMessage(
          createMessage(
            "assistant",
            "Пока не нашел удачных совпадений. Попробуйте расширить бюджет, убрать город или выбрать другой месяц."
          )
        );
        return;
      }

      appendMessage(
        createMessage(
          "assistant",
          visibleRecommendations.length > 0
            ? "Вот что сейчас выглядит наиболее подходящим по вашим пожеланиям."
            : "Подобрал актуальные варианты напрямую из текущего каталога.",
          "success",
          actualRecommendations
        )
      );
    } catch (error) {
      const fallbackRecommendations = buildFallbackRecommendations(
        payload,
        catalogTours
      );

      if (fallbackRecommendations.length > 0) {
        appendMessage(
          createMessage(
            "assistant",
            "Сейчас покажу лучшие актуальные варианты из каталога.",
            "success",
            fallbackRecommendations
          )
        );
      } else {
        appendMessage(
          createMessage(
            "assistant",
            error instanceof Error
              ? error.message
              : "Не удалось получить рекомендации прямо сейчас.",
            "error"
          )
        );
      }
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
  const hasMessages = messages.length > 0;

  return (
    <>
      {isOpen ? (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden rounded-[30px] border border-[#e8d6bb] bg-[#fffaf2] shadow-[0_28px_90px_rgba(45,23,12,0.22)] ${isMobile
              ? "inset-x-3 bottom-2 top-9"
              : "bottom-6 left-6 w-[380px] max-w-[calc(100vw-48px)]"
            }`}
          style={
            isMobile
              ? undefined
              : { height: `min(${DESKTOP_CHAT_HEIGHT}px, calc(100vh - 32px))` }
          }
        >
          <div className="bg-[linear-gradient(135deg,#5b3a29_0%,#8b5a3c_45%,#e38a1f_100%)] px-4 py-3 text-white sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 sm:text-[11px] sm:tracking-[0.18em]">
                  <Bot size={14} />
                  ИИ помощник
                </div>
                <h2 className="mt-2.5 text-[1.2rem] font-semibold leading-tight sm:mt-3 sm:text-[1.75rem]">
                  Подбор тура в формате чата
                </h2>
                <p className="mt-1.5 max-w-[15rem] text-[13px] leading-5 text-white/80 sm:mt-2 sm:max-w-[18rem] sm:text-sm sm:leading-6">
                  Помогу найти тур и быстро подскажу нужные разделы сайта.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20 sm:h-10 sm:w-10"
                aria-label="Закрыть окно"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fffaf2_0%,#fff4e6_100%)] px-3 py-3 sm:px-5 sm:py-4">
              {messages.map((message) => {
                const isAssistant = message.role === "assistant";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-[24px] px-4 py-3 shadow-sm ${isAssistant
                          ? message.tone === "error"
                            ? "border border-red-200 bg-[#fff2f2] text-red-700"
                            : message.tone === "success"
                              ? "border border-emerald-200 bg-[#f7fff8] text-slate-800"
                              : "border border-[#eddcc0] bg-[#fffdf8] text-slate-800"
                          : "bg-[#5b3a29] text-white"
                        }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-6">{message.text}</p>

                      {message.recommendations?.length ? (
                        <div className="mt-4 space-y-3">
                          {message.recommendations.map((recommendation) => (
                            <div
                              key={recommendation.tourId}
                              className="rounded-[22px] border border-[#ecdac0] bg-white px-4 py-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="text-base font-semibold text-slate-900">
                                    {recommendation.title}
                                  </h3>
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5e8] px-3 py-1">
                                      <MapPin size={12} />
                                      {recommendation.city}, {recommendation.country}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5e8] px-3 py-1">
                                      <CalendarDays size={12} />
                                      {formatDateRange(recommendation.startDate, recommendation.endDate)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5e8] px-3 py-1">
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
                              className="rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6a4431]"
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
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ead9bf] bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                    <LoaderCircle size={16} className="animate-spin" />
                    Подбираю лучший маршрут...
                  </div>
                </div>
              ) : null}

              {!hasMessages ? (
                <div className="rounded-[24px] border border-dashed border-[#ead7bc] bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
                  Напишите вопрос, и я помогу с подбором тура.
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            {quickReplies.length > 0 ? (
              <div className="border-t border-[#ead9bf] bg-[#fff8ee] px-3 py-2.5 sm:px-5 sm:py-3">
                <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
                  <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                    {quickReplies.map((reply) => (
                      <button
                        key={`${step}-${reply.label}-${reply.value}`}
                        type="button"
                        onClick={() => void handleAnswer(reply.value)}
                        className="rounded-full border border-[#ead7bc] bg-white px-3 py-2 text-sm font-medium text-[#6a4b36] transition hover:border-[#ddb887] hover:bg-[#fff5e7]"
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="border-t border-[#ead9bf] bg-[#fffaf2] px-3 py-2.5 sm:px-5 sm:py-4">
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
                    className="min-h-[46px] w-full resize-none overflow-hidden rounded-[18px] border border-[#ead7bc] bg-white px-4 py-3 text-sm leading-5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e38a1f] disabled:cursor-not-allowed disabled:bg-slate-100 sm:min-h-[52px] sm:rounded-[20px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isThinking || inputValue.trim().length === 0}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#e38a1f] text-white shadow-lg transition hover:bg-[#d7790f] disabled:cursor-not-allowed disabled:bg-[#f2c788] sm:h-[52px] sm:w-[52px]"
                  aria-label="Отправить сообщение"
                >
                  <Send size={18} />
                </button>
              </form>

              <div className="mt-3 -mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
                <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                  <button
                    type="button"
                    onClick={startConversation}
                    className="rounded-full bg-[#f7ead5] px-4 py-2 text-sm font-medium text-[#6a4b36] transition hover:bg-[#f1ddbe]"
                  >
                    Подобрать заново
                  </button>
                  <Link
                    to="/tours"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full bg-[#f7ead5] px-4 py-2 text-sm font-medium text-[#6a4b36] transition hover:bg-[#f1ddbe]"
                  >
                    Каталог
                  </Link>
                  {session?.role === "Client" ? (
                    <Link
                      to="/bookings"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full bg-[#f7ead5] px-4 py-2 text-sm font-medium text-[#6a4b36] transition hover:bg-[#f1ddbe]"
                    >
                      Мои бронирования
                    </Link>
                  ) : null}
                  {session?.role === "Admin" || session?.role === "Operator" ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full bg-[#f7ead5] px-4 py-2 text-sm font-medium text-[#6a4b36] transition hover:bg-[#f1ddbe]"
                    >
                      Панель
                    </Link>
                  ) : null}
                  {hasResults ? (
                    <Link
                      to="/tours"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full bg-[#ffe5b1] px-4 py-2 text-sm font-medium text-[#915000] transition hover:bg-[#ffd88b]"
                    >
                      Открыть каталог туров
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-2.5 text-xs leading-5 text-slate-400">
                {draft.country ? `Страна: ${draft.country}. ` : ""}
                {draft.city ? `Город: ${draft.city}. ` : ""}
                {draft.budget
                  ? `Бюджет: до ${formatPrice(parsePositiveNumber(draft.budget) ?? 0)} ₽. `
                  : ""}
                {draft.desiredDurationDays ? `Длительность: ${draft.desiredDurationDays} дн. ` : ""}
                {draft.preferredMonth ? `Месяц: ${formatMonthLabel(draft.preferredMonth)}.` : ""}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Открыть чат"
          className={`group fixed z-[60] flex items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-amber-600 active:bg-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 focus-visible:ring-offset-2 ${
            isMobile ? "bottom-6 left-4 h-12 w-12" : "bottom-6 left-6 h-12 w-12"
          }`}
        >
          <MessageCircle size={24} />

          {!isMobile ? (
            <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-[#ead7bc] bg-white px-4 py-2 text-sm font-semibold text-[#6a4b36] opacity-0 shadow-[0_14px_35px_rgba(45,23,12,0.12)] transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:inline-flex">
              ИИ помощник
            </span>
          ) : null}
        </button>
      ) : null}
    </>
  );
}
