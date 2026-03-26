"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const geoCache = new Map<string, string | null>();

function cacheKey(lat: number, lng: number, lang: string) {
  return `${lat.toFixed(6)},${lng.toFixed(6)},${lang}`;
}

async function resolveAddress(
  lat: number,
  lng: number,
  lang: string
): Promise<string | null> {
  const key = cacheKey(lat, lng, lang);
  if (geoCache.has(key)) return geoCache.get(key) ?? null;
  const q = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    lang,
  });
  try {
    const res = await fetch(`/api/reverse-geocode?${q}`);
    const data = (await res.json()) as { address?: string | null };
    const addr =
      typeof data.address === "string" && data.address.trim() !== ""
        ? data.address.trim()
        : null;
    geoCache.set(key, addr);
    return addr;
  } catch {
    geoCache.set(key, null);
    return null;
  }
}

type GeocodedAddressProps = {
  lat: number;
  lng: number;
  locale: string;
};

/** Адрес по координатам; при отсутствии в данных — один запрос к /api/reverse-geocode. */
export default function GeocodedAddress({ lat, lng, locale }: GeocodedAddressProps) {
  const tCommon = useTranslations("Common");
  const key = cacheKey(lat, lng, locale);
  const [text, setText] = useState<string | null>(() =>
    geoCache.has(key) ? (geoCache.get(key) ?? null) : null
  );
  const [loading, setLoading] = useState(() => !geoCache.has(key));

  useEffect(() => {
    const k = cacheKey(lat, lng, locale);
    if (geoCache.has(k)) {
      setText(geoCache.get(k) ?? null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setText(null);
    resolveAddress(lat, lng, locale).then((addr) => {
      if (!cancelled) {
        setText(addr);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, locale]);

  if (loading) {
    return (
      <span className="text-xs leading-snug text-slate-400">{tCommon("loadingAddress")}</span>
    );
  }

  if (text) {
    return <span className="text-xs leading-snug text-slate-700">{text}</span>;
  }

  return (
    <span className="font-mono text-[11px] text-slate-500">
      {lat.toFixed(5)}, {lng.toFixed(5)}
    </span>
  );
}
