import { useEffect, useMemo, useState } from "react";
import { fetchTours } from "../api/api";
import { useAuthSession } from "./useAuthSession";
import { useFrontOfficeStore } from "./useFrontOfficeStore";
import {
  getFavoriteTourIds,
  pruneFavoriteTourIds,
  subscribeFavoriteTours,
  toggleFavoriteTour,
} from "../lib/favoriteTours";

export function useFavoriteTours() {
  const session = useAuthSession();
  const isAvailable = session?.role === "Client";
  const userEmail = isAvailable ? session.email : null;
  const { bookings } = useFrontOfficeStore();
  const [favoriteTourIds, setFavoriteTourIds] = useState<string[]>(() =>
    getFavoriteTourIds(userEmail)
  );

  const unavailableTourIdSet = useMemo(() => {
    const normalizedEmail = userEmail?.trim().toLowerCase() ?? "";
    const unavailableTourIds = new Set<string>();

    if (!normalizedEmail) {
      return unavailableTourIds;
    }

    bookings
      .filter(
        (booking) =>
          booking.status !== "Cancelled" &&
          booking.clientEmail.trim().toLowerCase() === normalizedEmail
      )
      .forEach((booking) => {
        unavailableTourIds.add(booking.tourId);
      });

    return unavailableTourIds;
  }, [bookings, userEmail]);

  useEffect(() => {
    setFavoriteTourIds(getFavoriteTourIds(userEmail));

    return subscribeFavoriteTours(userEmail, () => {
      setFavoriteTourIds(getFavoriteTourIds(userEmail));
    });
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) {
      setFavoriteTourIds([]);
      return;
    }

    let isCancelled = false;

    void fetchTours()
      .then((tours) => {
        if (isCancelled) {
          return;
        }

        const visibleTourIds = tours
          .map((tour) => tour.id)
          .filter((tourId) => !unavailableTourIdSet.has(tourId));
        const validFavoriteIds = pruneFavoriteTourIds(
          userEmail,
          visibleTourIds
        );
        setFavoriteTourIds(validFavoriteIds);
      })
      .catch(() => {
        if (!isCancelled) {
          setFavoriteTourIds(getFavoriteTourIds(userEmail));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userEmail, unavailableTourIdSet]);

  return {
    favoriteTourIds,
    isFavorite: (tourId: string) => favoriteTourIds.includes(tourId),
    toggleFavorite: (tourId: string) => {
      if (!userEmail) {
        return;
      }

      setFavoriteTourIds(toggleFavoriteTour(userEmail, tourId));
    },
    isAvailable,
    favoriteCount: favoriteTourIds.length,
  };
}
