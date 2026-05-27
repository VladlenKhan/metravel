import { useSyncExternalStore } from "react";
import { getAuthSession, subscribeAuthSession } from "../api/api";

export function useAuthSession() {
  return useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
}
