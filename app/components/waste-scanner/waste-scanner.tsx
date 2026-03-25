"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Leaf, Loader2, MapPin } from "lucide-react";
import { analyzeImage, type AnalysisPayload } from "@/lib/api";

const DEMO_BOTTLE =
  "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop&q=80";

type WasteScannerProps = {
  location: { lat: number; lng: number };
  /** Пользователь кликнул по карте и зафиксировал точку */
  locationReady: boolean;
  /** После успешного анализа — добавить маркер на карту */
  onAnalysisSuccess?: (summary: string) => void;
};

export default function WasteScanner({
  location,
  locationReady,
  onAnalysisSuccess,
}: WasteScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewBlobRef = useRef<string | null>(null);

  const applyFile = useCallback((f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    setError(null);
    setResult(null);
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current);
      previewBlobRef.current = null;
    }
    const url = URL.createObjectURL(f);
    previewBlobRef.current = url;
    setPreview(url);
    setFile(f);
  }, []);

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applyFile(e.target.files?.[0]);
      e.target.value = "";
    },
    [applyFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!locationReady) return;
      applyFile(e.dataTransfer.files?.[0]);
    },
    [applyFile, locationReady]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (locationReady) e.dataTransfer.dropEffect = "copy";
  }, [locationReady]);

  useEffect(() => {
    return () => {
      if (previewBlobRef.current) {
        URL.revokeObjectURL(previewBlobRef.current);
        previewBlobRef.current = null;
      }
    };
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!file || !locationReady) return;
    setLoading(true);
    setError(null);
    try {
      const { analysis } = await analyzeImage(file, location.lat, location.lng);
      if (analysis) {
        setResult(analysis);
        onAnalysisSuccess?.(analysis.title);
      } else {
        setError("Не удалось разобрать ответ сервера");
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message === "Failed to fetch"
            ? "Сеть: не удалось отправить запрос. Проверьте, что бэкенд запущен и в .env задан BACKEND_API_URL / NEXT_PUBLIC_API_URL."
            : e.message
          : "Ошибка запроса";
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [file, location.lat, location.lng, locationReady, onAnalysisSuccess]);

  const displayImage = preview;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3 lg:gap-3 lg:px-3.5">
      <header className="shrink-0">
        <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900 sm:text-lg lg:text-xl">
          Қоқыс AI
        </h1>
        <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
          Умный помощник по сортировке
        </p>
      </header>

      {!locationReady && (
        <div className="flex shrink-0 items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900 sm:text-xs">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>Сначала нажмите на карту справа и выберите место съёмки отходов.</span>
        </div>
      )}

      {locationReady && (
        <p className="shrink-0 text-[10px] text-slate-500 sm:text-xs">
          Точка:{" "}
          <span className="font-mono text-slate-700">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </span>
        </p>
      )}

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`shrink-0 rounded-xl border-2 border-dashed border-emerald-200/90 bg-emerald-50/40 transition sm:rounded-2xl ${
          !locationReady ? "pointer-events-none opacity-45" : "hover:border-emerald-300"
        }`}
      >
        <label className="relative block min-h-[6rem] cursor-pointer px-3 py-3 sm:min-h-[7rem] sm:px-4 sm:py-4">
          <input
            type="file"
            accept="image/*"
            disabled={!locationReady}
            className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={onFile}
          />
          {preview ? (
            <div className="pointer-events-none flex flex-col items-center justify-center gap-2 text-center">
              <img
                src={preview}
                alt="Выбранное фото"
                className="max-h-36 max-w-full rounded-lg object-contain shadow-sm ring-1 ring-slate-200/80"
              />
              <p className="text-[10px] text-slate-600 sm:text-xs">
                Нажмите или перетащите другое фото
              </p>
            </div>
          ) : (
            <div className="pointer-events-none flex flex-col items-center gap-1.5 text-center sm:gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200/60 sm:h-11 sm:w-11">
                <Camera className="h-5 w-5 text-emerald-600 sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-xs font-medium leading-snug text-slate-800 sm:text-sm">
                Загрузите фото отходов
              </p>
              <p className="max-w-[18rem] text-[10px] leading-tight text-slate-500 sm:text-xs">
                После выбора точки — перетащите файл или нажмите
              </p>
            </div>
          )}
        </label>
      </div>

      {locationReady && file && (
        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Анализ…
            </>
          ) : (
            "Отправить на анализ"
          )}
        </button>
      )}

      {error && (
        <p className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] text-red-800 sm:text-xs">
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden sm:gap-2.5">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5">
          <h2 className="text-xs font-semibold text-slate-900 sm:text-sm">Результат сканирования</h2>
          {result?.confidenceLabel && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 sm:px-2.5 sm:text-xs">
              {result.confidenceLabel} уверенность
            </span>
          )}
        </div>

        <div className="flex min-h-[6.5rem] flex-1 flex-row overflow-hidden rounded-[20px] shadow-sm ring-1 ring-slate-200/70 sm:min-h-[7.5rem]">
          <div className="relative flex w-[38%] shrink-0 flex-col items-center justify-center bg-[#C6A689] p-2 sm:p-3">
            {displayImage ? (
              <img src={displayImage} alt="Загруженное фото" className="max-h-full max-w-full object-contain" />
            ) : (
              <Image
                src={DEMO_BOTTLE}
                alt="Пример"
                width={200}
                height={200}
                className="max-h-[min(100%,7rem)] w-auto object-contain opacity-40 sm:max-h-[8.5rem]"
                sizes="40vw"
              />
            )}
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1.5 border-l-[5px] border-[#EAB308] bg-white px-3 py-3 sm:gap-2 sm:px-5 sm:py-5">
            {result ? (
              <>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#B8860B] sm:text-[10px] md:text-xs">
                  {result.category}
                </p>
                <h3 className="text-sm font-bold leading-tight text-black sm:text-base md:text-lg">
                  {result.title}
                </h3>
                <p className="line-clamp-4 text-[10px] leading-snug text-slate-600 sm:line-clamp-none sm:text-xs sm:leading-relaxed md:text-sm">
                  {result.description || "—"}
                </p>
              </>
            ) : (
              <p className="text-[10px] leading-snug text-slate-400 sm:text-xs">
                Результат появится после анализа фото на сервере.
              </p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 shrink-0 gap-2 rounded-lg bg-emerald-50/90 p-2.5 ring-1 ring-emerald-100 sm:gap-2.5 sm:rounded-xl sm:p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 sm:h-9 sm:w-9 sm:rounded-xl">
            <Leaf className="h-4 w-4 text-emerald-800 sm:h-[18px] sm:w-[18px]" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-h-0 min-w-0">
            <p className="text-xs font-semibold text-emerald-900 sm:text-sm">Эко-факт</p>
            <p className="mt-0.5 line-clamp-4 text-[10px] leading-snug text-emerald-900/85 sm:line-clamp-none sm:text-xs sm:leading-relaxed">
              {result?.ecoFact ??
                "После анализа здесь может отображаться факт об утилизации выбранного материала."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
