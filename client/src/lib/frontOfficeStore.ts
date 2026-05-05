export type LocalService = {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type LocalTourServiceLink = {
  tourId: string;
  serviceId: string;
  isIncluded: boolean;
  additionalPrice: number;
};

export type LocalBookingStatus = "Created" | "Confirmed" | "Cancelled" | "Completed";

export type LocalBookingRecord = {
  id: string;
  clientId: string;
  clientEmail: string;
  clientFullName: string;
  tourId: string;
  tourTitle: string;
  tourCountry: string;
  tourCity: string;
  totalPrice: number;
  bookingDate: string;
  status: LocalBookingStatus;
  createdAt: string;
  updatedAt: string;
};

export type LocalPaymentStatus = "Pending" | "Paid" | "Cancelled";

export type LocalPaymentRecord = {
  id: string;
  bookingId: string;
  clientId: string;
  clientFullName: string;
  tourTitle: string;
  amount: number;
  status: LocalPaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type LocalLinkedService = LocalService & {
  isIncluded: boolean;
  additionalPrice: number;
};

type FrontOfficeStore = {
  services: LocalService[];
  tourServiceLinks: LocalTourServiceLink[];
  bookings: LocalBookingRecord[];
  payments: LocalPaymentRecord[];
};

const FRONT_OFFICE_STORE_KEY = "metravel_front_office_store";
const FRONT_OFFICE_STORE_EVENT = "metravel-front-office-store-changed";

const DEFAULT_STORE: FrontOfficeStore = {
  services: [],
  tourServiceLinks: [],
  bookings: [],
  payments: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  const normalizedValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : 0;
}

function normalizeLocalPaymentStatus(value: unknown): LocalPaymentStatus {
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

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeServices(value: unknown): LocalService[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const service = isRecord(item) ? item : {};
      const id = asString(service.id);
      const name = asString(service.name).trim();

      if (!id || !name) {
        return null;
      }

      return {
        id,
        name,
        description: asString(service.description),
        price: asNumber(service.price),
        createdAt: asString(service.createdAt) || new Date().toISOString(),
        updatedAt: asString(service.updatedAt) || new Date().toISOString(),
      } satisfies LocalService;
    })
    .filter((item): item is LocalService => item !== null);
}

function normalizeTourServiceLinks(value: unknown): LocalTourServiceLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const link = isRecord(item) ? item : {};
      const tourId = asString(link.tourId);
      const serviceId = asString(link.serviceId);

      if (!tourId || !serviceId) {
        return null;
      }

      return {
        tourId,
        serviceId,
        isIncluded: Boolean(link.isIncluded),
        additionalPrice: Math.max(0, asNumber(link.additionalPrice)),
      } satisfies LocalTourServiceLink;
    })
    .filter((item): item is LocalTourServiceLink => item !== null);
}

function normalizeBookings(value: unknown): LocalBookingRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const booking = isRecord(item) ? item : {};
      const id = asString(booking.id);
      const clientId = asString(booking.clientId);
      const clientEmail = asString(booking.clientEmail);
      const clientFullName = asString(booking.clientFullName);
      const tourId = asString(booking.tourId);
      const tourTitle = asString(booking.tourTitle);
      const status = asString(booking.status) as LocalBookingStatus;

      if (!id || !tourId || !tourTitle || !status) {
        return null;
      }

      return {
        id,
        clientId,
        clientEmail,
        clientFullName,
        tourId,
        tourTitle,
        tourCountry: asString(booking.tourCountry),
        tourCity: asString(booking.tourCity),
        totalPrice: asNumber(booking.totalPrice),
        bookingDate: asString(booking.bookingDate) || new Date().toISOString(),
        status,
        createdAt: asString(booking.createdAt) || new Date().toISOString(),
        updatedAt: asString(booking.updatedAt) || new Date().toISOString(),
      } satisfies LocalBookingRecord;
    })
    .filter((item): item is LocalBookingRecord => item !== null);
}

function normalizePayments(value: unknown): LocalPaymentRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const payment = isRecord(item) ? item : {};
      const id = asString(payment.id);
      const bookingId = asString(payment.bookingId);
      const status = normalizeLocalPaymentStatus(payment.status);

      if (!id || !bookingId) {
        return null;
      }

      return {
        id,
        bookingId,
        clientId: asString(payment.clientId),
        clientFullName: asString(payment.clientFullName),
        tourTitle: asString(payment.tourTitle),
        amount: asNumber(payment.amount),
        status,
        createdAt: asString(payment.createdAt) || new Date().toISOString(),
        updatedAt: asString(payment.updatedAt) || new Date().toISOString(),
      } satisfies LocalPaymentRecord;
    })
    .filter((item): item is LocalPaymentRecord => item !== null);
}

function readStore(): FrontOfficeStore {
  if (typeof window === "undefined") {
    return DEFAULT_STORE;
  }

  const raw = window.localStorage.getItem(FRONT_OFFICE_STORE_KEY);
  if (!raw) {
    return DEFAULT_STORE;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      services: normalizeServices(parsed.services),
      tourServiceLinks: normalizeTourServiceLinks(parsed.tourServiceLinks),
      bookings: normalizeBookings(parsed.bookings),
      payments: normalizePayments(parsed.payments),
    };
  } catch {
    return DEFAULT_STORE;
  }
}

function writeStore(nextStore: FrontOfficeStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FRONT_OFFICE_STORE_KEY, JSON.stringify(nextStore));
  window.dispatchEvent(new Event(FRONT_OFFICE_STORE_EVENT));
}

function updateStore(updater: (currentStore: FrontOfficeStore) => FrontOfficeStore): FrontOfficeStore {
  const nextStore = updater(readStore());
  writeStore(nextStore);
  return nextStore;
}

export function subscribeFrontOfficeStore(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === FRONT_OFFICE_STORE_KEY) {
      callback();
    }
  };

  window.addEventListener(FRONT_OFFICE_STORE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(FRONT_OFFICE_STORE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getFrontOfficeSnapshot(): FrontOfficeStore {
  return readStore();
}

export function saveLocalBooking(
  booking: Omit<LocalBookingRecord, "createdAt" | "updatedAt">
): LocalBookingRecord {
  const now = new Date().toISOString();
  const nextBooking: LocalBookingRecord = {
    ...booking,
    createdAt: now,
    updatedAt: now,
  };

  updateStore((currentStore) => ({
    ...currentStore,
    bookings: [
      nextBooking,
      ...currentStore.bookings.filter((currentBooking) => currentBooking.id !== booking.id),
    ],
  }));

  return nextBooking;
}

export function updateLocalBookingStatus(
  bookingId: string,
  status: LocalBookingStatus
): LocalBookingRecord | null {
  let updatedBooking: LocalBookingRecord | null = null;

  updateStore((currentStore) => ({
    ...currentStore,
    bookings: currentStore.bookings.map((booking) => {
      if (booking.id !== bookingId) {
        return booking;
      }

      updatedBooking = {
        ...booking,
        status,
        updatedAt: new Date().toISOString(),
      };

      return updatedBooking;
    }),
  }));

  return updatedBooking;
}

export function saveLocalPayment(
  payment: Omit<LocalPaymentRecord, "createdAt" | "updatedAt">
): LocalPaymentRecord {
  const now = new Date().toISOString();
  const nextPayment: LocalPaymentRecord = {
    ...payment,
    createdAt: now,
    updatedAt: now,
  };

  updateStore((currentStore) => ({
    ...currentStore,
    payments: [
      nextPayment,
      ...currentStore.payments.filter((currentPayment) => currentPayment.id !== payment.id),
    ],
  }));

  return nextPayment;
}

export function updateLocalPaymentStatus(
  paymentId: string,
  status: LocalPaymentStatus
): LocalPaymentRecord | null {
  let updatedPayment: LocalPaymentRecord | null = null;

  updateStore((currentStore) => ({
    ...currentStore,
    payments: currentStore.payments.map((payment) => {
      if (payment.id !== paymentId) {
        return payment;
      }

      updatedPayment = {
        ...payment,
        status,
        updatedAt: new Date().toISOString(),
      };

      return updatedPayment;
    }),
  }));

  return updatedPayment;
}

export function updateLocalPaymentStatusByBookingId(
  bookingId: string,
  status: LocalPaymentStatus
): LocalPaymentRecord | null {
  let updatedPayment: LocalPaymentRecord | null = null;

  updateStore((currentStore) => ({
    ...currentStore,
    payments: currentStore.payments.map((payment) => {
      if (payment.bookingId !== bookingId) {
        return payment;
      }

      updatedPayment = {
        ...payment,
        status,
        updatedAt: new Date().toISOString(),
      };

      return updatedPayment;
    }),
  }));

  return updatedPayment;
}

export function deleteLocalTourRelatedData(tourId: string): void {
  updateStore((currentStore) => {
    const removedBookingIds = currentStore.bookings
      .filter((booking) => booking.tourId === tourId)
      .map((booking) => booking.id);
    const removedBookingIdSet = new Set(removedBookingIds);

    return {
      ...currentStore,
      tourServiceLinks: currentStore.tourServiceLinks.filter((link) => link.tourId !== tourId),
      bookings: currentStore.bookings.filter((booking) => booking.tourId !== tourId),
      payments: currentStore.payments.filter(
        (payment) => !removedBookingIdSet.has(payment.bookingId)
      ),
    };
  });
}

export function pruneLocalTourData(validTourIds: string[]): void {
  const validTourIdSet = new Set(validTourIds);

  updateStore((currentStore) => {
    const validBookings = currentStore.bookings.filter((booking) =>
      validTourIdSet.has(booking.tourId)
    );
    const validBookingIdSet = new Set(validBookings.map((booking) => booking.id));

    return {
      ...currentStore,
      tourServiceLinks: currentStore.tourServiceLinks.filter((link) =>
        validTourIdSet.has(link.tourId)
      ),
      bookings: validBookings,
      payments: currentStore.payments.filter((payment) =>
        validBookingIdSet.has(payment.bookingId)
      ),
    };
  });
}

export function saveLocalService(
  service: Pick<LocalService, "name" | "description" | "price"> & { id?: string }
): LocalService {
  const currentStore = readStore();
  const now = new Date().toISOString();
  const existingService = service.id
    ? currentStore.services.find((currentService) => currentService.id === service.id)
    : null;

  const nextService: LocalService = {
    id: existingService?.id ?? createId(),
    name: service.name.trim(),
    description: service.description.trim(),
    price: Math.max(0, service.price),
    createdAt: existingService?.createdAt ?? now,
    updatedAt: now,
  };

  updateStore((store) => ({
    ...store,
    services: [
      nextService,
      ...store.services.filter((currentService) => currentService.id !== nextService.id),
    ],
  }));

  return nextService;
}

export function deleteLocalService(serviceId: string): void {
  updateStore((currentStore) => ({
    ...currentStore,
    services: currentStore.services.filter((service) => service.id !== serviceId),
    tourServiceLinks: currentStore.tourServiceLinks.filter((link) => link.serviceId !== serviceId),
  }));
}

export function replaceTourServiceLinks(
  tourId: string,
  links: Array<Pick<LocalTourServiceLink, "serviceId" | "isIncluded" | "additionalPrice">>
): LocalTourServiceLink[] {
  const normalizedLinks = links
    .filter((link) => typeof link.serviceId === "string" && link.serviceId.trim().length > 0)
    .map((link) => ({
      tourId,
      serviceId: link.serviceId,
      isIncluded: link.isIncluded,
      additionalPrice: Math.max(0, link.additionalPrice),
    }));

  updateStore((currentStore) => ({
    ...currentStore,
    tourServiceLinks: [
      ...currentStore.tourServiceLinks.filter((link) => link.tourId !== tourId),
      ...normalizedLinks,
    ],
  }));

  return normalizedLinks;
}

export function getLinkedServicesForTour(
  tourId: string,
  services: LocalService[],
  links: LocalTourServiceLink[]
): LocalLinkedService[] {
  const servicesById = new Map(services.map((service) => [service.id, service]));

  return links
    .filter((link) => link.tourId === tourId)
    .map((link) => {
      const service = servicesById.get(link.serviceId);
      if (!service) {
        return null;
      }

      return {
        ...service,
        isIncluded: link.isIncluded,
        additionalPrice: link.additionalPrice,
      } satisfies LocalLinkedService;
    })
    .filter((service): service is LocalLinkedService => service !== null);
}
