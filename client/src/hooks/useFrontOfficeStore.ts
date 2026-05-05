import { useEffect, useState } from "react";
import {
  getFrontOfficeSnapshot,
  subscribeFrontOfficeStore,
  type LocalBookingRecord,
  type LocalPaymentRecord,
  type LocalService,
  type LocalTourServiceLink,
} from "../lib/frontOfficeStore";

type FrontOfficeSnapshot = {
  services: LocalService[];
  tourServiceLinks: LocalTourServiceLink[];
  bookings: LocalBookingRecord[];
  payments: LocalPaymentRecord[];
};

export function useFrontOfficeStore(): FrontOfficeSnapshot {
  const [snapshot, setSnapshot] = useState<FrontOfficeSnapshot>(getFrontOfficeSnapshot());

  useEffect(() => {
    setSnapshot(getFrontOfficeSnapshot());

    return subscribeFrontOfficeStore(() => {
      setSnapshot(getFrontOfficeSnapshot());
    });
  }, []);

  return snapshot;
}
