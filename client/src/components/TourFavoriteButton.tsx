import { Heart } from "lucide-react";

type TourFavoriteButtonProps = {
  active: boolean;
  onToggle: () => void;
};

export default function TourFavoriteButton({ active, onToggle }: TourFavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? "Убрать из желаемых туров" : "Добавить в желаемые туры"}
      className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
        active
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500"
      }`}
    >
      <Heart size={20} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
