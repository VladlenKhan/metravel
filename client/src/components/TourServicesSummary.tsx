import { ConciergeBell, Plus } from "lucide-react";
import { useMemo } from "react";
import { useFrontOfficeStore } from "../hooks/useFrontOfficeStore";
import { getLinkedServicesForTour } from "../lib/frontOfficeStore";

type TourServicesSummaryProps = {
  tourId: string;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export default function TourServicesSummary({ tourId }: TourServicesSummaryProps) {
  const { services, tourServiceLinks } = useFrontOfficeStore();

  const linkedServices = useMemo(
    () => getLinkedServicesForTour(tourId, services, tourServiceLinks),
    [services, tourId, tourServiceLinks]
  );

  if (linkedServices.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
        <ConciergeBell size={16} />
        Услуги в туре
      </div>

      {linkedServices.slice(0, 3).map((service) => (
        <span
          key={`${tourId}-${service.id}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
        >
          <span className="truncate">{service.name}</span>
          {service.isIncluded ? (
            <span className="shrink-0 text-emerald-600">включено</span>
          ) : service.additionalPrice > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-amber-700">
              <Plus size={12} />
              {formatPrice(service.additionalPrice)} ₽
            </span>
          ) : (
            <span className="shrink-0 text-slate-400">по запросу</span>
          )}
        </span>
      ))}

      {linkedServices.length > 3 ? (
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
          + еще {linkedServices.length - 3}
        </span>
      ) : null}
    </div>
  );
}
