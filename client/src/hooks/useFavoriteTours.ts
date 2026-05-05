import { useEffect, useState } from "react";
import { fetchTours } from "../api/api";
import { useAuthSession } from "./useAuthSession";
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
  const [favoriteTourIds, setFavoriteTourIds] = useState<string[]>(() =>
    getFavoriteTourIds(userEmail)
  );

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

        const validFavoriteIds = pruneFavoriteTourIds(
          userEmail,
          tours.map((tour) => tour.id)
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
  }, [userEmail]);

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
