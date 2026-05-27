export const FIELD_LIMITS = {
  firstName: 40,
  lastName: 50,
  fullName: 80,
  email: 120,
  password: 72,
  phone: 18,
  passport: 20,
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
  return value.replace(/\s+/g, "").toLowerCase().slice(0, maxLength);
}

export function sanitizePhoneInput(
  value: string,
  maxLength: number = FIELD_LIMITS.phone
): string {
  let sanitized = value.replace(/[^\d+\s()-]/g, "");
  sanitized = sanitized.replace(/\+/g, (match, offset) => (offset === 0 ? match : ""));

  if (sanitized.includes("+") && !sanitized.startsWith("+")) {
    sanitized = `+${sanitized.replace(/\+/g, "")}`;
  }

  return sanitized.replace(/\s{2,}/g, " ").trimStart().slice(0, maxLength);
}

export function sanitizePassportInput(
  value: string,
  maxLength: number = FIELD_LIMITS.passport
): string {
  return value
    .toUpperCase()
    .replace(/[^0-9A-ZА-ЯЁ -]/g, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()
    .slice(0, maxLength);
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
