const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const AUTH_STORAGE_KEY = "metravel_auth";
const AUTH_EVENT_NAME = "metravel-auth-changed";
const TOUR_MEDIA_STORAGE_KEY = "metravel_tour_media";
const RESERVED_BOOKING_STATUSES = new Set<BookingStatus>(["Confirmed", "Completed"]);

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: unknown;
  authToken?: string;
  signal?: AbortSignal;
};

export type UserRole = "Admin" | "Operator" | "Client";

export type AuthSession = {
  token: string;
  fullName: string;
  email: string;
  role: UserRole;
};

let authSessionCache: AuthSession | null = null;
let authSessionRawCache: string | null = null;

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  clientId: string | null;
};

export type ClientProfile = {
  id: string;
  fullName: string;
  phoneNumber: string;
  passportNumber: string;
  isRegular: boolean;
  email: string;
};

export type ClientUpsertPayload = {
  fullName: string;
  phoneNumber: string;
  passportNumber: string;
  isRegular: boolean;
  email: string;
};

export type Tour = {
  id: string;
  title: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  totalSeats: number;
  availableSeats: number;
  description?: string | null;
  imageUrl?: string | null;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  passportNumber?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CreateBookingPayload = {
  clientId?: string;
  tourId: string;
  totalPrice: number;
  bookingDate: string;
};

export type BookingStatus = "Created" | "Confirmed" | "Cancelled" | "Completed";

export type RecommendationRequestPayload = {
  country?: string;
  city?: string;
  budget?: number;
  desiredDurationDays?: number;
  preferredMonth?: number;
  top?: number;
};

export type TourRecommendation = {
  tourId: string;
  title: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  basePrice: number;
  score: number;
  explanation: string;
};

export type PaymentStatus = "Pending" | "Paid" | "Cancelled";

export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  clientId: string | null;
};

export type AdminCreateUserPayload = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  passportNumber: string;
  role: UserRole;
  isActive: boolean;
};

export type TourUpsertPayload = {
  title: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  totalSeats: number;
  availableSeats: number;
  description?: string | null;
  imageUrl?: string | null;
};

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

function buildUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function notifyAuthListeners(): void {
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

function createDeferredRegistrationSeed(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  }

  return `${Date.now()}`;
}

function updateAuthSessionCache(raw: string | null, parsed: AuthSession | null): AuthSession | null {
  authSessionRawCache = raw;
  authSessionCache = parsed;
  return authSessionCache;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(source: Record<string, unknown>, camelCaseKey: string, pascalCaseKey: string): string {
  const value = source[camelCaseKey] ?? source[pascalCaseKey];
  return typeof value === "string" ? value : "";
}

function readNumber(source: Record<string, unknown>, camelCaseKey: string, pascalCaseKey: string): number {
  const value = source[camelCaseKey] ?? source[pascalCaseKey];
  const normalizedValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : 0;
}

function normalizeDateValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!isRecord(value)) {
    return "";
  }

  const year = Number(value.year ?? value.Year);
  const month = Number(value.month ?? value.Month);
  const day = Number(value.day ?? value.Day);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return "";
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getReservedSeatsByTourId(): Map<string, number> {
  if (typeof window === "undefined") {
    return new Map();
  }

  const raw = window.localStorage.getItem("metravel_front_office_store");
  if (!raw) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rawBookings = Array.isArray(parsed.bookings) ? parsed.bookings : [];
    const reservedSeatsByTourId = new Map<string, number>();

    rawBookings.forEach((booking) => {
      if (!isRecord(booking)) {
        return;
      }

      const rawTourId = booking.tourId ?? booking.TourId;
      const rawStatus = booking.status ?? booking.Status;
      const tourId = typeof rawTourId === "string" ? rawTourId : "";
      const status = (typeof rawStatus === "string" ? rawStatus : "") as BookingStatus;

      if (!tourId || !RESERVED_BOOKING_STATUSES.has(status)) {
        return;
      }

      reservedSeatsByTourId.set(tourId, (reservedSeatsByTourId.get(tourId) ?? 0) + 1);
    });

    return reservedSeatsByTourId;
  } catch {
    return new Map();
  }
}

function applyReservedSeatOverlay(tours: Tour[]): Tour[] {
  const reservedSeatsByTourId = getReservedSeatsByTourId();
  if (reservedSeatsByTourId.size === 0) {
    return tours;
  }

  return tours.map((tour) => {
    const reservedSeats = reservedSeatsByTourId.get(tour.id) ?? 0;
    if (reservedSeats <= 0) {
      return tour;
    }

    return {
      ...tour,
      availableSeats: Math.max(0, Math.min(tour.totalSeats, tour.availableSeats - reservedSeats)),
    };
  });
}

function readTourMediaMap(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(TOUR_MEDIA_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === "string" &&
          typeof entry[1] === "string" &&
          entry[1].trim().length > 0
      )
    );
  } catch {
    return {};
  }
}

function writeTourMediaMap(mediaMap: Record<string, string>): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedEntries = Object.entries(mediaMap).filter(
    (entry): entry is [string, string] =>
      typeof entry[0] === "string" &&
      entry[0].trim().length > 0 &&
      typeof entry[1] === "string" &&
      entry[1].trim().length > 0
  );

  if (normalizedEntries.length === 0) {
    try {
      window.localStorage.removeItem(TOUR_MEDIA_STORAGE_KEY);
    } catch {
    }
    return;
  }

  try {
    window.localStorage.setItem(
      TOUR_MEDIA_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(normalizedEntries))
    );
  } catch {
  }
}

function syncTourImageUrl(tourId: string, imageUrl: string | null | undefined): string | null {
  const normalizedTourId = tourId.trim();
  if (!normalizedTourId) {
    return null;
  }

  const normalizedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
  const mediaMap = readTourMediaMap();

  if (normalizedImageUrl) {
    mediaMap[normalizedTourId] = normalizedImageUrl;
  } else {
    delete mediaMap[normalizedTourId];
  }

  writeTourMediaMap(mediaMap);
  return normalizedImageUrl || null;
}

function normalizeTour(
  rawTour: unknown,
  index: number,
  tourMediaMap: Record<string, string> = readTourMediaMap()
): Tour {
  const tour = isRecord(rawTour) ? rawTour : {};
  const id = readString(tour, "id", "Id") || `tour-${index}`;

  return {
    id,
    title: readString(tour, "title", "Title") || "Тур без названия",
    city: readString(tour, "city", "City") || "Город уточняется",
    country: readString(tour, "country", "Country") || "Направление уточняется",
    startDate: normalizeDateValue(tour.startDate ?? tour.StartDate),
    endDate: normalizeDateValue(tour.endDate ?? tour.EndDate),
    basePrice: readNumber(tour, "basePrice", "BasePrice"),
    totalSeats: readNumber(tour, "totalSeats", "TotalSeats"),
    availableSeats: readNumber(tour, "availableSeats", "AvailableSeats"),
    description: readString(tour, "description", "Description") || null,
    imageUrl: tourMediaMap[id] || null,
  };
}

function normalizeClientProfile(rawProfile: unknown): ClientProfile {
  const profile = isRecord(rawProfile) ? rawProfile : {};

  return {
    id: readString(profile, "id", "Id"),
    fullName: readString(profile, "fullName", "FullName"),
    phoneNumber: readString(profile, "phoneNumber", "PhoneNumber"),
    passportNumber: readString(profile, "passportNumber", "PassportNumber"),
    isRegular: Boolean(profile.isRegular ?? profile.IsRegular),
    email: readString(profile, "email", "Email"),
  };
}

function normalizeRecommendation(rawRecommendation: unknown, index: number): TourRecommendation {
  const recommendation = isRecord(rawRecommendation) ? rawRecommendation : {};

  return {
    tourId: readString(recommendation, "tourId", "TourId") || `recommendation-${index}`,
    title: readString(recommendation, "title", "Title") || "Подходящий тур",
    country: readString(recommendation, "country", "Country") || "Направление уточняется",
    city: readString(recommendation, "city", "City") || "Город уточняется",
    startDate: normalizeDateValue(recommendation.startDate ?? recommendation.StartDate),
    endDate: normalizeDateValue(recommendation.endDate ?? recommendation.EndDate),
    durationDays: readNumber(recommendation, "durationDays", "DurationDays"),
    basePrice: readNumber(recommendation, "basePrice", "BasePrice"),
    score: readNumber(recommendation, "score", "Score"),
    explanation:
      readString(recommendation, "explanation", "Explanation") ||
      "Подобран по общей близости параметров.",
  };
}

function normalizePaymentStatusValue(value: unknown): PaymentStatus {
  if (typeof value === "string") {
    if (value === "Pending" || value === "Paid" || value === "Cancelled") {
      return value;
    }

    const normalizedNumber = Number(value);
    if (normalizedNumber === 1) {
      return "Paid";
    }
    if (normalizedNumber === 2) {
      return "Cancelled";
    }
  }

  if (typeof value === "number") {
    if (value === 1) {
      return "Paid";
    }
    if (value === 2) {
      return "Cancelled";
    }
  }

  return "Pending";
}

function normalizePayment(rawPayment: unknown): Payment {
  const payment = isRecord(rawPayment) ? rawPayment : {};

  return {
    id: readString(payment, "id", "Id"),
    bookingId: readString(payment, "bookingId", "BookingId"),
    amount: readNumber(payment, "amount", "Amount"),
    status: normalizePaymentStatusValue(payment.status ?? payment.Status),
  };
}

export function isDeferredPhoneNumber(phoneNumber: string | null | undefined): boolean {
  return typeof phoneNumber === "string" && phoneNumber.startsWith("pending-phone-");
}

export function isDeferredPassportNumber(passportNumber: string | null | undefined): boolean {
  return typeof passportNumber === "string" && passportNumber.startsWith("pending-passport-");
}

export function isClientProfileComplete(profile: ClientProfile | null): boolean {
  if (!profile) {
    return false;
  }

  const normalizedPhoneNumber = profile.phoneNumber.trim();
  const normalizedPassportNumber = profile.passportNumber.trim();

  return (
    normalizedPhoneNumber.length >= 6 &&
    normalizedPassportNumber.length >= 5 &&
    !isDeferredPhoneNumber(normalizedPhoneNumber) &&
    !isDeferredPassportNumber(normalizedPassportNumber)
  );
}

export function getDisplayPhoneNumber(profile: ClientProfile | null): string {
  if (!profile || isDeferredPhoneNumber(profile.phoneNumber)) {
    return "";
  }

  return profile.phoneNumber;
}

export function getDisplayPassportNumber(profile: ClientProfile | null): string {
  if (!profile || isDeferredPassportNumber(profile.passportNumber)) {
    return "";
  }

  return profile.passportNumber;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(buildUrl(path), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    let message = "Не удалось выполнить запрос.";

    try {
      const data = (await response.json()) as { message?: string; title?: string };
      message = data.message || data.title || message;
    } catch {
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export function saveAuthSession(session: AuthSession): void {
  const raw = JSON.stringify(session);
  updateAuthSessionCache(raw, session);
  localStorage.setItem(AUTH_STORAGE_KEY, raw);
  localStorage.setItem("token", session.token);
  notifyAuthListeners();
}

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (raw === authSessionRawCache) {
    return authSessionCache;
  }

  if (!raw) {
    return updateAuthSessionCache(null, null);
  }

  try {
    return updateAuthSessionCache(raw, JSON.parse(raw) as AuthSession);
  } catch {
    return updateAuthSessionCache(null, null);
  }
}

export function getAuthToken(): string | null {
  return getAuthSession()?.token || localStorage.getItem("token");
}

export function clearAuthSession(): void {
  updateAuthSessionCache(null, null);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("token");
  notifyAuthListeners();
}

export function subscribeAuthSession(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === AUTH_STORAGE_KEY || event.key === "token") {
      callback();
    }
  };

  window.addEventListener(AUTH_EVENT_NAME, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function register(payload: RegisterPayload): Promise<AuthSession> {
  const seed = createDeferredRegistrationSeed();

  return request<AuthSession>("/api/Auth/register", {
    method: "POST",
    body: {
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      phoneNumber: payload.phoneNumber?.trim() || `pending-phone-${seed}`,
      passportNumber: payload.passportNumber?.trim() || `pending-passport-${seed}`,
    },
  });
}

export function login(payload: LoginPayload): Promise<AuthSession> {
  return request<AuthSession>("/api/Auth/login", {
    method: "POST",
    body: payload,
  });
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Сессия не найдена.");
  }

  return request<CurrentUser>("/api/Auth/me", {
    authToken: token,
    signal,
  });
}

export function fetchTours(signal?: AbortSignal): Promise<Tour[]> {
  return request<unknown>("/api/Tours", { signal }).then((response) => {
    if (!Array.isArray(response)) {
      return [];
    }

    const tourMediaMap = readTourMediaMap();
    return applyReservedSeatOverlay(
      response.map((tour, index) => normalizeTour(tour, index, tourMediaMap))
    );
  });
}

export function predictRecommendations(
  payload: RecommendationRequestPayload,
  signal?: AbortSignal
): Promise<TourRecommendation[]> {
  return request<unknown>("/api/Recommendations/predict", {
    method: "POST",
    signal,
    body: {
      country: payload.country?.trim() || undefined,
      city: payload.city?.trim() || undefined,
      budget: payload.budget,
      desiredDurationDays: payload.desiredDurationDays,
      preferredMonth: payload.preferredMonth,
      top: payload.top ?? 3,
    },
  }).then((response) => {
    if (!Array.isArray(response)) {
      return [];
    }

    return response.map((recommendation, index) =>
      normalizeRecommendation(recommendation, index)
    );
  });
}

export function fetchClient(clientId: string, signal?: AbortSignal): Promise<ClientProfile> {
  const token = getAuthToken();

  return request<unknown>(`/api/Clients/${clientId}`, {
    authToken: token ?? undefined,
    signal,
  }).then((response) => normalizeClientProfile(response));
}

export function fetchClients(signal?: AbortSignal): Promise<ClientProfile[]> {
  const token = getAuthToken();

  return request<unknown>("/api/Clients", {
    authToken: token ?? undefined,
    signal,
  }).then((response) => {
    if (!Array.isArray(response)) {
      return [];
    }

    return response.map((client) => normalizeClientProfile(client));
  });
}

export function createClient(payload: ClientUpsertPayload): Promise<ClientProfile> {
  const token = getAuthToken();

  return request<unknown>("/api/Clients", {
    method: "POST",
    authToken: token ?? undefined,
    body: {
      id: EMPTY_GUID,
      fullName: payload.fullName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      passportNumber: payload.passportNumber.trim(),
      isRegular: payload.isRegular,
      email: payload.email.trim(),
    },
  }).then((response) => normalizeClientProfile(response));
}

export function updateClient(clientId: string, payload: ClientProfile): Promise<ClientProfile> {
  const token = getAuthToken();

  return request<unknown>(`/api/Clients/${clientId}`, {
    method: "PUT",
    authToken: token ?? undefined,
    body: payload,
  }).then((response) => normalizeClientProfile(response));
}

export function deleteClient(clientId: string): Promise<void> {
  const token = getAuthToken();

  return request<void>(`/api/Clients/${clientId}`, {
    method: "DELETE",
    authToken: token ?? undefined,
  });
}

export function createBooking(payload: CreateBookingPayload): Promise<{ bookingId: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<{ bookingId: string }>("/api/Bookings", {
    method: "POST",
    authToken: token,
    body: {
      clientId: payload.clientId || EMPTY_GUID,
      tourId: payload.tourId,
      totalPrice: payload.totalPrice,
      bookingDate: payload.bookingDate,
    },
  });
}

export function changeBookingStatus(
  bookingId: string,
  status: Exclude<BookingStatus, "Created">
): Promise<{ bookingId: string; status: Exclude<BookingStatus, "Created"> }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<{ bookingId: string; status: Exclude<BookingStatus, "Created"> }>(
    `/api/Bookings/${bookingId}/status`,
    {
      method: "POST",
      authToken: token,
      body: { status },
    }
  );
}

export function fetchUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<AdminUser[]>("/api/Users", {
    authToken: token,
    signal,
  });
}

export function updateUserRole(userId: string, role: UserRole): Promise<AdminUser> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<AdminUser>(`/api/Users/${userId}/role`, {
    method: "PUT",
    authToken: token,
    body: { role },
  });
}

export function updateUserStatus(userId: string, isActive: boolean): Promise<AdminUser> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<AdminUser>(`/api/Users/${userId}/status`, {
    method: "PUT",
    authToken: token,
    body: { isActive },
  });
}

export function deleteUser(userId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<void>(`/api/Users/${userId}`, {
    method: "DELETE",
    authToken: token,
  });
}

export async function adminCreateUser(payload: AdminCreateUserPayload): Promise<AdminUser> {
  const normalizedEmail = payload.email.trim().toLowerCase();

  await register({
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    password: payload.password,
    phoneNumber: payload.phoneNumber.trim(),
    passportNumber: payload.passportNumber.trim(),
  });

  const users = await fetchUsers();
  const createdUser = users.find(
    (user) => user.email.trim().toLowerCase() === normalizedEmail
  );

  if (!createdUser) {
    throw new Error("Пользователь создан, но пока не появился в списке.");
  }

  let nextUser = createdUser;

  if (payload.role !== nextUser.role) {
    nextUser = await updateUserRole(nextUser.id, payload.role);
  }

  if (payload.isActive !== nextUser.isActive) {
    nextUser = await updateUserStatus(nextUser.id, payload.isActive);
  }

  return nextUser;
}

export function createPayment(bookingId: string, amount: number): Promise<Payment> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<unknown>("/api/Payments", {
    method: "POST",
    authToken: token,
    body: {
      bookingId,
      amount,
    },
  }).then((response) => normalizePayment(response));
}

export function fetchPayment(paymentId: string): Promise<Payment> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<unknown>(`/api/Payments/${paymentId}`, {
    authToken: token,
  }).then((response) => normalizePayment(response));
}

export function payPayment(paymentId: string): Promise<Payment> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<unknown>(`/api/Payments/${paymentId}/pay`, {
    method: "POST",
    authToken: token,
  }).then((response) => normalizePayment(response));
}

export function cancelPayment(paymentId: string): Promise<Payment> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<unknown>(`/api/Payments/${paymentId}/cancel`, {
    method: "POST",
    authToken: token,
  }).then((response) => normalizePayment(response));
}

export function createTour(payload: TourUpsertPayload): Promise<Tour> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<unknown>("/api/Tours", {
    method: "POST",
    authToken: token,
    body: {
      id: EMPTY_GUID,
      title: payload.title,
      city: payload.city,
      country: payload.country,
      startDate: payload.startDate,
      endDate: payload.endDate,
      basePrice: payload.basePrice,
      totalSeats: payload.totalSeats,
      availableSeats: payload.availableSeats,
      description: payload.description?.trim() || "",
    },
  }).then((response) => {
    const normalizedTour = normalizeTour(response, 0);
    const imageUrl = syncTourImageUrl(normalizedTour.id, payload.imageUrl);

    return {
      ...normalizedTour,
      imageUrl,
    };
  });
}

export function updateTour(tourId: string, payload: TourUpsertPayload): Promise<Tour> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<unknown>(`/api/Tours/${tourId}`, {
    method: "PUT",
    authToken: token,
    body: {
      id: tourId,
      title: payload.title,
      city: payload.city,
      country: payload.country,
      startDate: payload.startDate,
      endDate: payload.endDate,
      basePrice: payload.basePrice,
      totalSeats: payload.totalSeats,
      availableSeats: payload.availableSeats,
      description: payload.description?.trim() || "",
    },
  }).then((response) => {
    const normalizedTour = normalizeTour(response, 0);
    const imageUrl = syncTourImageUrl(normalizedTour.id, payload.imageUrl);

    return {
      ...normalizedTour,
      imageUrl,
    };
  });
}

export function deleteTour(tourId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Требуется авторизация.");
  }

  return request<void>(`/api/Tours/${tourId}`, {
    method: "DELETE",
    authToken: token,
  }).then(() => {
    syncTourImageUrl(tourId, null);
  });
}
