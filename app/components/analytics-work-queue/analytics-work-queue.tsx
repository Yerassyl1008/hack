"use client";

import { BarChart3, MapPin, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { IncidentMapMarker } from "@/lib/incident-markers";
import GeocodedAddress from "@/app/components/incident-list/geocoded-address";

function formatWhen(ts: number | undefined, loc: string): string {
  if (ts == null || ts <= 0) return "—";
  try {
    return new Intl.DateTimeFormat(loc, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return "—";
  }
}

type ConfirmDialog =
  | null
  | { kind: "one"; marker: IncidentMapMarker }
  | { kind: "all" };

type AnalyticsWorkQueueProps = {
  markers: IncidentMapMarker[];
  locale: string;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onShowOnMap?: (marker: IncidentMapMarker) => void;
};

export default function AnalyticsWorkQueue({
  markers,
  locale,
  onDelete,
  onClearAll,
  onShowOnMap,
}: AnalyticsWorkQueueProps) {
  const t = useTranslations("Analytics");
  const [dialog, setDialog] = useState<ConfirmDialog>(null);

  const stats = useMemo(() => {
    const total = markers.length;
    const ok = markers.filter((m) => m.severity === "normal").length;
    const attention = markers.filter((m) => m.severity === "error").length;
    return { total, ok, attention };
  }, [markers]);

  const sorted = useMemo(
    () =>
      [...markers].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [markers]
  );

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  const executeDelete = () => {
    if (!dialog) return;
    if (dialog.kind === "one") onDelete(dialog.marker.id);
    else onClearAll();
    setDialog(null);
  };

  const openClearAllDialog = () => {
    if (!markers.length) return;
    setDialog({ kind: "all" });
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <header className="shrink-0">
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            <BarChart3 className="h-6 w-6 text-emerald-700" strokeWidth={2} aria-hidden />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </header>

        <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t("statTotal")}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/80">
              {t("statOk")}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-900 sm:text-2xl">
              {stats.ok}
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-800/80">
              {t("statAttention")}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-red-900 sm:text-2xl">
              {stats.attention}
            </p>
          </div>
        </div>

        {markers.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <p className="text-xs font-medium text-slate-600">{t("queueHint")}</p>
            <button
              type="button"
              onClick={openClearAllDialog}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
            >
              {t("clearAll")}
            </button>
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-12 text-center">
            <BarChart3 className="h-10 w-10 text-slate-300" strokeWidth={1.5} aria-hidden />
            <p className="text-sm font-medium text-slate-600">{t("emptyTitle")}</p>
            <p className="max-w-md text-xs text-slate-500">{t("emptyHint")}</p>
          </div>
        ) : (
          <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 pb-6">
            {sorted.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm"
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
                  <time className="text-[11px] text-slate-500">
                    {formatWhen(m.createdAt, locale)}
                  </time>
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug text-slate-900">
                  {m.problem}
                </p>
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  <span className="min-w-0 flex-1 leading-snug">
                    {m.address ? m.address : (
                      <GeocodedAddress lat={m.lat} lng={m.lng} locale={locale} />
                    )}
                  </span>
                </p>
                {m.recommendation ? (
                  <p className="mt-2 rounded-lg bg-amber-50/90 px-2.5 py-2 text-[11px] leading-relaxed text-amber-950/90 ring-1 ring-amber-100">
                    <span className="font-bold text-amber-900/90">{t("recommendation")}: </span>
                    {m.recommendation}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {onShowOnMap && (
                    <button
                      type="button"
                      onClick={() => onShowOnMap(m)}
                      className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
                    >
                      {t("showOnMap")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: "one", marker: m })}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-red-100 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t("remove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialog ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-label={t("confirmCancel")}
            onClick={() => setDialog(null)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="analytics-delete-heading"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2
              id="analytics-delete-heading"
              className="text-lg font-bold text-slate-900"
            >
              {dialog.kind === "one" ? t("modalDeleteTitle") : t("modalClearTitle")}
            </h2>
            {dialog.kind === "one" ? (
              <>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {t("modalDeleteItem", {
                    title: dialog.marker.problem.slice(0, 120),
                  })}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {t("modalDeleteBody")}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {t("modalClearBody")}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {t("confirmCancel")}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                {t("confirmRemove")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
