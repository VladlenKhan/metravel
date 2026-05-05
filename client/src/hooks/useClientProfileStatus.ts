import { useEffect, useState } from "react";
import {
  fetchClient,
  fetchCurrentUser,
  isClientProfileComplete,
  type ClientProfile,
  type CurrentUser,
} from "../api/api";
import { useAuthSession } from "./useAuthSession";

type ClientProfileStatus = {
  sessionRole: "Admin" | "Operator" | "Client" | null;
  currentUser: CurrentUser | null;
  profile: ClientProfile | null;
  loading: boolean;
  error: string | null;
  isComplete: boolean;
  refresh: () => void;
};

export function useClientProfileStatus(): ClientProfileStatus {
  const session = useAuthSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<{
    currentUser: CurrentUser | null;
    profile: ClientProfile | null;
    loading: boolean;
    error: string | null;
  }>({
    currentUser: null,
    profile: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!session?.token) {
      setState({
        currentUser: null,
        profile: null,
        loading: false,
        error: null,
      });
      return;
    }

    if (session.role !== "Client") {
      setState({
        currentUser: null,
        profile: null,
        loading: false,
        error: null,
      });
      return;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      try {
        const currentUser = await fetchCurrentUser(controller.signal);
        if (!currentUser.clientId) {
          setState({
            currentUser,
            profile: null,
            loading: false,
            error: "Не удалось определить профиль клиента.",
          });
          return;
        }

        const profile = await fetchClient(currentUser.clientId, controller.signal);
        setState({
          currentUser,
          profile,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          currentUser: null,
          profile: null,
          loading: false,
          error: error instanceof Error ? error.message : "Не удалось загрузить профиль.",
        });
      }
    };

    void loadProfile();

    return () => controller.abort();
  }, [refreshKey, session?.role, session?.token]);

  return {
    sessionRole: session?.role ?? null,
    currentUser: state.currentUser,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    isComplete: isClientProfileComplete(state.profile),
    refresh: () => setRefreshKey((current) => current + 1),
  };
}
