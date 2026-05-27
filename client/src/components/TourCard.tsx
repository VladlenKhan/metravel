import { CalendarDays, Coins, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { Tour } from "../api/api";
import TourServicesSummary from "./TourServicesSummary";

const gradients = [
  "from-sky-500 via-cyan-500 to-emerald-400",
  "from-orange-500 via-amber-400 to-yellow-300",
  "from-violet-600 via-fuchsia-500 to-rose-400",
  "from-teal-600 via-emerald-500 to-lime-400",
];

type TourCardProps = {
  tour: Tour;
  index?: number;
  badge?: string;
  footer?: ReactNode;
};

function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatTourPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatTourDateRange(startDate: string, endDate: string): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) {
    return "Даты уточняются";
  }

  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getDurationDays(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) {
    return 0;
  }

  const difference = end.getTime() - start.getTime();

  return Math.max(1, Math.round(difference / (1000 * 60 * 60 * 24)));
}

export default function TourCard({ tour, index = 0, badge, footer }: TourCardProps) {
  const durationDays = getDurationDays(tour.startDate, tour.endDate);
  const gradient = gradients[index % gradients.length];
  const normalizedDescription =
    typeof tour.description === "string" ? tour.description.trim() : "";
  const hasAvailableSeats = tour.availableSeats > 0;

  return (
    <article className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.16)] md:h-[400px] md:flex-row">
      <div className="relative min-h-[200px] max-h-[200px] overflow-hidden sm:min-h-[200px] sm:max-h-[200px] md:h-full md:max-h-none md:min-h-0 md:w-[300px] md:min-w-[300px] md:max-w-[300px] md:shrink-0">
        {tour.imageUrl ? (
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="absolute right-0 top-0 h-28 w-28 -translate-y-6 translate-x-6 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-28 w-28 -translate-x-6 translate-y-6 rounded-full bg-slate-950/20 blur-2xl" />
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.24)_38%,rgba(15,23,42,0.82)_100%)]" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur-sm">
            {tour.country}
          </span>

          {badge ? (
            <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur-sm">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          <h3 className="max-w-[18rem] text-lg font-bold leading-tight sm:text-[1.7rem]">
            {tour.title}
          </h3>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm">
            <MapPin size={16} />
            {tour.city}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 font-medium text-slate-700">
              <CalendarDays size={16} />
              Даты
            </div>
            <p>{formatTourDateRange(tour.startDate, tour.endDate)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {durationDays > 0 ? `${durationDays} дн.` : "Продолжительность уточняется"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 font-medium text-slate-700">
              <Coins size={16} />
              Цена
            </div>
            <p>{formatTourPrice(tour.basePrice)}</p>
            <p className="mt-1 text-xs text-slate-500">за одного путешественника</p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 font-medium text-slate-700">
              <Users size={16} />
              Формат
            </div>
            <p>{tour.availableSeats} свободных мест</p>
            <p className="mt-1 text-xs text-slate-500">
              {durationDays > 0 ? `${durationDays} дн. путешествия` : "Длительность уточняется"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
          <div>
            <p className="font-semibold text-slate-900">Свободные места</p>
            <p className="mt-1 text-slate-500">
              {tour.availableSeats} из {tour.totalSeats}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
              hasAvailableSeats
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Users size={16} />
            {hasAvailableSeats ? "Можно бронировать" : "Мест нет"}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <p className="line-clamp-2 break-words text-sm leading-6 text-slate-600">
            {normalizedDescription ||
              "Подробное описание скоро появится. Тур уже доступен для бронирования."}
          </p>

          <TourServicesSummary tourId={tour.id} />
        </div>

        {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
      </div>
    </article>
  );
}
