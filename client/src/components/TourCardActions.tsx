import type { AuthSession, Tour } from "../api/api";
import TourBookingAction from "./TourBookingAction";
import TourFavoriteButton from "./TourFavoriteButton";

type TourCardActionsProps = {
  tour: Tour;
  session: AuthSession | null;
  profileLoading: boolean;
  profileComplete: boolean;
  profileError: string | null;
  bookingTourId: string | null;
  bookingLockLabel: string | null;
  onBook: (tour: Tour) => void;
  showFavoriteButton: boolean;
  isFavorite: boolean;
  onToggleFavorite: (tourId: string) => void;
};

export default function TourCardActions({
  tour,
  session,
  profileLoading,
  profileComplete,
  profileError,
  bookingTourId,
  bookingLockLabel,
  onBook,
  showFavoriteButton,
  isFavorite,
  onToggleFavorite,
}: TourCardActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <TourBookingAction
          tour={tour}
          session={session}
          profileLoading={profileLoading}
          profileComplete={profileComplete}
          profileError={profileError}
          bookingTourId={bookingTourId}
          bookingLockLabel={bookingLockLabel}
          onBook={onBook}
        />
      </div>

      {showFavoriteButton ? (
        <div className="shrink-0 self-end sm:self-auto">
          <TourFavoriteButton
            active={isFavorite}
            onToggle={() => onToggleFavorite(tour.id)}
          />
        </div>
      ) : null}
    </div>
  );
}
