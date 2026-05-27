import { useEffect, useState } from "react";
import { fetchTours, type Tour } from "../api/api";
import { pruneLocalTourData } from "../lib/frontOfficeStore";

type ToursState = {
  tours: Tour[];
  loading: boolean;
  error: string | null;
};

export function useTours() {
  const [state, setState] = useState<ToursState>({
    tours: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadTours = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const tours = await fetchTours(controller.signal);
        pruneLocalTourData(tours.map((tour) => tour.id));
        setState({ tours, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          tours: [],
          loading: false,
          error: error instanceof Error ? error.message : "Не удалось загрузить туры.",
        });
      }
    };

    void loadTours();

    return () => controller.abort();
  }, []);

  return state;
}
