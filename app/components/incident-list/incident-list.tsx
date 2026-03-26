"use client";

import { AlertOctagon, MapPin } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { IncidentMapMarker } from "@/lib/incident-markers";
import GeocodedAddress from "./geocoded-address";

function formatWhen(ts: number | undefined, locale: string): string {
  if (ts == null || ts <= 0) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return "—";
  }
}

type IncidentListProps = {
  markers: IncidentMapMarker[];
  locale: string;
  onShowOnMap?: (marker: IncidentMapMarker) => void;
};

export default function IncidentList({
  markers,
  locale,
  onShowOnMap,
}: IncidentListProps) {
  const t = useTranslations("Incidents");

  const sorted = useMemo(
    () =>
      [...markers].sort(
        (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
      ),
    [markers]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-12 text-center">
        <AlertOctagon className="h-10 w-10 text-slate-300" strokeWidth={1.5} aria-hidden />
        <p className="text-sm font-medium text-slate-600">{t("emptyTitle")}</p>
        <p className="max-w-sm text-xs text-slate-500">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 pb-4">
      {sorted.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                m.severity === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-emerald-100 text-emerald-900"
              }`}
            >
              {m.severity === "error" ? t("badgeError") : t("badgeOk")}
            </span>
            <time
              className="text-[11px] text-slate-500"
              dateTime={
                m.createdAt ? new Date(m.createdAt).toISOString() : undefined
              }
            >
              {formatWhen(m.createdAt, locale)}
            </time>
          </div>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-900">
            {m.problem}
          </p>
          <div className="mt-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t("addressLine")}
            </p>
            <p className="mt-0.5 flex items-start gap-1.5">
              <MapPin
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                {m.address ? (
                  <span className="text-xs leading-snug text-slate-700">{m.address}</span>
                ) : (
                  <GeocodedAddress lat={m.lat} lng={m.lng} locale={locale} />
                )}
              </span>
            </p>
          </div>
          {m.recommendation ? (
            <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/80 px-2.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800/90">
                {t("recommendationLine")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-950/90">
                {m.recommendation}
              </p>
            </div>
          ) : null}
          {onShowOnMap && (
            <button
              type="button"
              onClick={() => onShowOnMap(m)}
              className="mt-3 text-xs font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline"
            >
              {t("showOnMap")}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
