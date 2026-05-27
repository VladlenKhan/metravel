export const REGULAR_CLIENT_DISCOUNT_RATE = 0.1;

export function getRegularClientDiscountAmount(basePrice: number, isRegularClient: boolean): number {
  if (!isRegularClient || !Number.isFinite(basePrice) || basePrice <= 0) {
    return 0;
  }

  return Math.round(basePrice * REGULAR_CLIENT_DISCOUNT_RATE);
}

export function getEffectiveTourPrice(basePrice: number, isRegularClient: boolean): number {
  const normalizedBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  const discountAmount = getRegularClientDiscountAmount(normalizedBasePrice, isRegularClient);

  return Math.max(0, normalizedBasePrice - discountAmount);
}
