import {
  FIELD_LIMITS,
  FIELD_PATTERNS,
  FIELD_TITLES,
  sanitizePersonNameInput,
} from "./formSanitizers";

export type CardPaymentField =
  | "cardNumber"
  | "expiry"
  | "cvc"
  | "firstName"
  | "lastName";

export type CardPaymentFormValues = {
  cardNumber: string;
  expiry: string;
  cvc: string;
  firstName: string;
  lastName: string;
};

export type CardPaymentFieldErrors = Partial<Record<CardPaymentField, string>>;

const CARD_NUMBER_MIN_LENGTH = 13;
const CARD_NUMBER_MAX_LENGTH = 19;
const AMEX_LENGTH = 15;
const CVC_LENGTH_DEFAULT = 3;
const CVC_LENGTH_AMEX = 4;

const PERSON_NAME_PATTERN = new RegExp(FIELD_PATTERNS.personName);

export function sanitizeCardNumberInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, CARD_NUMBER_MAX_LENGTH);
}

export function formatCardNumberDisplay(digits: string): string {
  const normalized = sanitizeCardNumberInput(digits);
  return normalized.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function sanitizeCvcInput(value: string, cardDigits: string): string {
  const maxLength = isAmexCard(cardDigits) ? CVC_LENGTH_AMEX : CVC_LENGTH_DEFAULT;
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function sanitizeExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function sanitizeCardFirstNameInput(value: string): string {
  return sanitizePersonNameInput(value, FIELD_LIMITS.firstName);
}

export function sanitizeCardLastNameInput(value: string): string {
  return sanitizePersonNameInput(value, FIELD_LIMITS.lastName);
}

export function isAmexCard(cardDigits: string): boolean {
  return /^3[47]/.test(cardDigits);
}

export function getExpectedCardNumberLength(cardDigits: string): number {
  return isAmexCard(cardDigits) ? AMEX_LENGTH : CARD_NUMBER_MAX_LENGTH;
}

export function isValidLuhn(cardDigits: string): boolean {
  if (!/^\d+$/.test(cardDigits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = cardDigits.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardDigits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function parseExpiry(expiry: string): { month: number; year: number } | null {
  const match = expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);

  if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) {
    return null;
  }

  return { month, year };
}

function isExpiryInFuture(expiry: string): boolean {
  const parsed = parseExpiry(expiry);
  if (!parsed) {
    return false;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (parsed.year > currentYear) {
    return true;
  }

  if (parsed.year < currentYear) {
    return false;
  }

  return parsed.month >= currentMonth;
}

function validatePersonName(
  value: string,
  fieldLabel: "Имя" | "Фамилия",
  minLength: number,
  maxLength: number
): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${fieldLabel} обязательно для заполнения.`;
  }

  if (trimmed.length < minLength) {
    return `${fieldLabel} должно содержать минимум ${minLength} буквы.`;
  }

  if (trimmed.length > maxLength) {
    return `${fieldLabel} не должно быть длиннее ${maxLength} символов.`;
  }

  if (!PERSON_NAME_PATTERN.test(trimmed)) {
    return FIELD_TITLES.personName;
  }

  return undefined;
}

export function validateCardPaymentField(
  field: CardPaymentField,
  values: CardPaymentFormValues
): string | undefined {
  const cardDigits = sanitizeCardNumberInput(values.cardNumber);

  switch (field) {
    case "cardNumber": {
      if (!cardDigits) {
        return "Введите номер карты.";
      }

      if (isAmexCard(cardDigits)) {
        if (cardDigits.length !== AMEX_LENGTH) {
          return `Для American Express нужен номер из ${AMEX_LENGTH} цифр.`;
        }
      } else if (
        cardDigits.length < CARD_NUMBER_MIN_LENGTH ||
        cardDigits.length > CARD_NUMBER_MAX_LENGTH
      ) {
        return `Номер карты должен содержать от ${CARD_NUMBER_MIN_LENGTH} до ${CARD_NUMBER_MAX_LENGTH} цифр.`;
      }

      if (!isValidLuhn(cardDigits)) {
        return "Номер карты недействителен. Проверьте цифры и попробуйте снова.";
      }

      return undefined;
    }
    case "expiry": {
      if (!values.expiry.trim()) {
        return "Укажите срок действия карты.";
      }

      if (!parseExpiry(values.expiry)) {
        return "Срок действия указывается в формате ММ/ГГ, например 09/28.";
      }

      if (!isExpiryInFuture(values.expiry)) {
        return "Срок действия карты уже истёк. Укажите актуальный месяц и год.";
      }

      return undefined;
    }
    case "cvc": {
      const expectedCvcLength = isAmexCard(cardDigits)
        ? CVC_LENGTH_AMEX
        : CVC_LENGTH_DEFAULT;
      const cvcDigits = sanitizeCvcInput(values.cvc, cardDigits);

      if (!cvcDigits) {
        return "Введите CVC/CVV-код с обратной стороны карты.";
      }

      if (cvcDigits.length !== expectedCvcLength) {
        return isAmexCard(cardDigits)
          ? "Для American Express нужен 4-значный код безопасности."
          : "CVC/CVV-код должен содержать 3 цифры.";
      }

      return undefined;
    }
    case "firstName":
      return validatePersonName(
        values.firstName,
        "Имя",
        2,
        FIELD_LIMITS.firstName
      );
    case "lastName":
      return validatePersonName(
        values.lastName,
        "Фамилия",
        2,
        FIELD_LIMITS.lastName
      );
    default:
      return undefined;
  }
}

export function validateCardPaymentForm(
  values: CardPaymentFormValues
): CardPaymentFieldErrors {
  const fields: CardPaymentField[] = [
    "cardNumber",
    "expiry",
    "cvc",
    "firstName",
    "lastName",
  ];

  const errors: CardPaymentFieldErrors = {};

  fields.forEach((field) => {
    const message = validateCardPaymentField(field, values);
    if (message) {
      errors[field] = message;
    }
  });

  return errors;
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
