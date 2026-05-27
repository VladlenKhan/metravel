const FAVORITE_TOURS_KEY_PREFIX = "metravel_favorite_tours:";
const FAVORITE_TOURS_EVENT = "metravel-favorite-tours-changed";

function getFavoriteToursKey(userEmail: string): string {
  return `${FAVORITE_TOURS_KEY_PREFIX}${userEmail.trim().toLowerCase()}`;
}

function normalizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))
  );
}

export function getFavoriteTourIds(userEmail: string | null): string[] {
  if (!userEmail) {
    return [];
  }

  const raw = localStorage.getItem(getFavoriteToursKey(userEmail));
  if (!raw) {
    return [];
  }

  try {
    return normalizeFavoriteIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeFavoriteTourIds(userEmail: string, ids: string[]): void {
  const normalizedIds = normalizeFavoriteIds(ids);
  localStorage.setItem(getFavoriteToursKey(userEmail), JSON.stringify(normalizedIds));
  window.dispatchEvent(new Event(FAVORITE_TOURS_EVENT));
}

export function pruneFavoriteTourIds(userEmail: string | null, validTourIds: string[]): string[] {
  if (!userEmail) {
    return [];
  }

  const validIdSet = new Set(
    validTourIds
      .filter((id): id is string => typeof id === "string")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
  );

  const currentIds = getFavoriteTourIds(userEmail);
  const nextIds = currentIds.filter((id) => validIdSet.has(id));

  if (nextIds.length !== currentIds.length) {
    writeFavoriteTourIds(userEmail, nextIds);
  }

  return nextIds;
}

export function toggleFavoriteTour(userEmail: string, tourId: string): string[] {
  const currentIds = getFavoriteTourIds(userEmail);
  const nextIds = currentIds.includes(tourId)
    ? currentIds.filter((id) => id !== tourId)
    : [...currentIds, tourId];

  writeFavoriteTourIds(userEmail, nextIds);
  return nextIds;
}

export function subscribeFavoriteTours(
  userEmail: string | null,
  callback: () => void
): () => void {
  if (!userEmail) {
    return () => {};
  }

  const key = getFavoriteToursKey(userEmail);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === key) {
      callback();
    }
  };

  window.addEventListener(FAVORITE_TOURS_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(FAVORITE_TOURS_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
