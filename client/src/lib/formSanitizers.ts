export const FIELD_LIMITS = {
  firstName: 40,
  lastName: 50,
  fullName: 80,
  email: 120,
  password: 72,
  phone: 18,
  passport: 11,
  title: 90,
  location: 60,
  shortText: 80,
  description: 800,
  serviceDescription: 500,
  imageUrl: 300,
  search: 80,
  price: 50000000,
  seats: 999,
  additionalPrice: 5000000,
} as const;

export const FIELD_PATTERNS = {
  personName: "^[A-Za-zА-Яа-яЁё]+(?:[ '-][A-Za-zА-Яа-яЁё]+)*$",
  email: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
  password:
    "^(?=.*[A-Za-zА-Яа-яЁё])(?=.*\\d)[A-Za-zА-Яа-яЁё\\d!@#$%^&*()_+\\-=\\[\\]{};':\\\",./?\\\\|`~]{6,72}$",
  phone: "^\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}$",
  passport: "^\\d{4} \\d{6}$",
  text: "^[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9 .,'\\-()&/:!?]*$",
  digits: "^\\d+$",
  url: "^https?://.+$",
} as const;

export const FIELD_TITLES = {
  personName: "Допустимы только буквы, пробел, дефис и апостроф.",
  email: "Введите корректный email, например user@example.com.",
  password:
    "Пароль должен содержать от 6 до 72 символов: буквы, цифры и допустимые спецсимволы без пробелов.",
  phone: "Введите номер в формате +7 (999) 123-45-67.",
  passport: "Введите серию и номер паспорта в формате 1234 567890.",
  digits: "Допустимы только цифры.",
  text: "Используйте буквы, цифры, пробелы и базовые знаки препинания.",
  url: "Введите корректную ссылку, начинающуюся с http:// или https://.",
} as const;

function collapseInlineSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trimStart();
}

export function sanitizePersonNameInput(
  value: string,
  maxLength: number = FIELD_LIMITS.fullName
): string {
  return collapseInlineSpaces(value)
    .replace(/[^\p{L}\s'-]/gu, "")
    .slice(0, maxLength);
}

export function sanitizeEmailInput(
  value: string,
  maxLength: number = FIELD_LIMITS.email
): string {
  return value
    .replace(/\s+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._%+\-@]/g, "")
    .slice(0, maxLength);
}

export function sanitizePasswordInput(
  value: string,
  maxLength: number = FIELD_LIMITS.password
): string {
  return value
    .replace(/\s+/g, "")
    .replace(/[^A-Za-zА-Яа-яЁё0-9!@#$%^&*()_+\-=[\]{};':",./?\\|`~]/g, "")
    .slice(0, maxLength);
}

export function sanitizePhoneInput(
  value: string,
  maxLength: number = FIELD_LIMITS.phone
): string {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
  if (!digitsOnly) {
    return "";
  }

  let normalizedDigits = digitsOnly;
  if (normalizedDigits.startsWith("8")) {
    normalizedDigits = `7${normalizedDigits.slice(1)}`;
  } else if (!normalizedDigits.startsWith("7")) {
    normalizedDigits = `7${normalizedDigits}`.slice(0, 11);
  }

  const body = normalizedDigits.slice(1, 11);
  let formatted = "+7";

  if (body.length > 0) {
    formatted += ` (${body.slice(0, 3)}`;
  }
  if (body.length >= 3) {
    formatted += ")";
  }
  if (body.length > 3) {
    formatted += ` ${body.slice(3, 6)}`;
  }
  if (body.length > 6) {
    formatted += `-${body.slice(6, 8)}`;
  }
  if (body.length > 8) {
    formatted += `-${body.slice(8, 10)}`;
  }

  return formatted.slice(0, maxLength);
}

export function sanitizePassportInput(
  value: string,
  maxLength: number = FIELD_LIMITS.passport
): string {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
  if (digitsOnly.length <= 4) {
    return digitsOnly;
  }

  return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`.slice(0, maxLength);
}

export function sanitizeShortTextInput(
  value: string,
  maxLength: number = FIELD_LIMITS.shortText
): string {
  return collapseInlineSpaces(value)
    .replace(/[^\p{L}\p{N}\s.,'"()\-&/]/gu, "")
    .slice(0, maxLength);
}

export function sanitizeTitleInput(
  value: string,
  maxLength: number = FIELD_LIMITS.title
): string {
  return collapseInlineSpaces(value)
    .replace(/[^\p{L}\p{N}\s.,:!?'"()\-&/]/gu, "")
    .slice(0, maxLength);
}

export function sanitizeMultilineTextInput(
  value: string,
  maxLength: number = FIELD_LIMITS.description
): string {
  return value
    .replace(/\r/g, "")
    .replace(/[^\p{L}\p{N}\s.,:!?'"()\-&/%]/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart()
    .slice(0, maxLength);
}

type IntegerInputOptions = {
  min?: number;
  max: number;
  maxDigits?: number;
};

export function sanitizeIntegerInput(
  value: string,
  { min = 0, max, maxDigits = String(max).length }: IntegerInputOptions
): string {
  const digitsOnly = value.replace(/\D/g, "").slice(0, maxDigits);
  if (!digitsOnly) {
    return "";
  }

  const numericValue = Number(digitsOnly);
  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return String(Math.min(max, Math.max(min, numericValue)));
}

export function sanitizeUrlInput(
  value: string,
  maxLength: number = FIELD_LIMITS.imageUrl
): string {
  return value.trimStart().slice(0, maxLength);
}
