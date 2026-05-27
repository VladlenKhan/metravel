import { useMemo, useState } from "react";
import { createBooking, fetchCurrentUser, type Tour } from "../api/api";
import { useAuthSession } from "./useAuthSession";
import { saveLocalBooking } from "../lib/frontOfficeStore";
import { useFrontOfficeStore } from "./useFrontOfficeStore";
import { createLocalGuid, isRecoverableConnectionIssue } from "../lib/network";
import { getEffectiveTourPrice } from "../lib/pricing";

export function useTourBooking(isRegularClient: boolean = false) {
  const session = useAuthSession();
  const { bookings } = useFrontOfficeStore();
  const [bookingTourId, setBookingTourId] = useState<string | null>(null);
  const [bookingFeedback, setBookingFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const activeBookingsByTourId = useMemo(() => {
    const sessionEmail = session?.email?.trim().toLowerCase() ?? "";
    const activeBookings = new Map<string, (typeof bookings)[number]>();

    if (!sessionEmail) {
      return activeBookings;
    }

    bookings
      .filter(
        (booking) =>
          booking.status !== "Cancelled" &&
          booking.clientEmail.trim().toLowerCase() === sessionEmail
      )
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
      .forEach((booking) => {
        if (!activeBookings.has(booking.tourId)) {
          activeBookings.set(booking.tourId, booking);
        }
      });

    return activeBookings;
  }, [bookings, session?.email]);

  const unavailableBookingTourIds = useMemo(() => {
    const sessionEmail = session?.email?.trim().toLowerCase() ?? "";
    const bookedTours = new Set<string>();

    if (!sessionEmail) {
      return bookedTours;
    }

    bookings
      .filter(
        (booking) =>
          booking.status !== "Cancelled" &&
          booking.clientEmail.trim().toLowerCase() === sessionEmail
      )
      .forEach((booking) => {
        bookedTours.add(booking.tourId);
      });

    return bookedTours;
  }, [bookings, session?.email]);

  const getTourBookingLockLabel = (tourId: string): string | null => {
    const booking = activeBookingsByTourId.get(tourId);
    if (!booking) {
      return null;
    }

    switch (booking.status) {
      case "Confirmed":
        return "Бронирование подтверждено";
      case "Completed":
        return "Бронирование завершено";
      case "Created":
      default:
        return "Заявка уже отправлена";
    }
  };

  const handleBooking = async (tour: Tour) => {
    if (bookingTourId) {
      return;
    }

    const existingBooking = activeBookingsByTourId.get(tour.id);
    if (existingBooking) {
      setBookingFeedback({
        type: "error",
        message:
          "По этому туру у вас уже есть активная заявка. Повторное бронирование станет доступно только после отмены.",
      });
      return;
    }

    setBookingFeedback(null);
    setBookingTourId(tour.id);
    const totalPrice = getEffectiveTourPrice(tour.basePrice, isRegularClient);

    try {
      const result = await createBooking({
        tourId: tour.id,
        totalPrice,
        bookingDate: new Date().toISOString(),
      });

      const currentUser = await fetchCurrentUser();

      saveLocalBooking({
        id: result.bookingId,
        clientId: currentUser.clientId || currentUser.id,
        clientEmail: currentUser.email || session?.email || "",
        clientFullName: currentUser.fullName || session?.fullName || "Клиент",
        tourId: tour.id,
        tourTitle: tour.title,
        tourCountry: tour.country,
        tourCity: tour.city,
        totalPrice,
        bookingDate: new Date().toISOString(),
        status: "Created",
      });

      setBookingFeedback({
        type: "success",
        message: `Заявка на бронирование отправлена. Номер: ${result.bookingId}. Следить за статусом можно в разделе «Мои бронирования».`,
      });
    } catch (bookingError) {
      if (isRecoverableConnectionIssue(bookingError)) {
        const fallbackBookingId = createLocalGuid();

        saveLocalBooking({
          id: fallbackBookingId,
          clientId: session?.email || fallbackBookingId,
          clientEmail: session?.email || "",
          clientFullName: session?.fullName || "Клиент",
          tourId: tour.id,
          tourTitle: tour.title,
          tourCountry: tour.country,
          tourCity: tour.city,
          totalPrice,
          bookingDate: new Date().toISOString(),
          status: "Created",
        });

        setBookingFeedback({
          type: "success",
          message:
            "Сервис бронирования временно недоступен, поэтому заявка сохранена локально. Ей уже можно управлять в разделе «Мои бронирования».",
        });
        setBookingTourId(null);
        return;
      }

      setBookingFeedback({
        type: "error",
        message:
          bookingError instanceof Error
            ? bookingError.message
            : "Не удалось отправить заявку на бронирование.",
      });
    } finally {
      setBookingTourId(null);
    }
  };

  return {
    bookingTourId,
    isBookingPending: bookingTourId !== null,
    bookingFeedback,
    unavailableBookingTourIds,
    getTourBookingLockLabel,
    handleBooking,
    clearBookingFeedback: () => setBookingFeedback(null),
  };
}
