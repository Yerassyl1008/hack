"use client";

import { useEffect, useState } from "react";

async function fetchAddress(
  lat: number,
  lng: number,
  lang: string,
  signal: AbortSignal
): Promise<string | null> {
  const q = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    lang,
  });
  const res = await fetch(`/api/reverse-geocode?${q}`, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { address?: string | null };
  return typeof data.address === "string" && data.address.length > 0
    ? data.address
    : null;
}

/**
 * После выбора точки на карте подгружает человекочитаемый адрес (Nominatim через /api).
 */
export function useReverseGeocode(
  lat: number,
  lng: number,
  enabled: boolean,
  locale: string
) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setAddress(null);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setAddress(null);

    const timer = window.setTimeout(() => {
      fetchAddress(lat, lng, locale, ac.signal)
        .then((a) => {
          if (!ac.signal.aborted) setAddress(a);
        })
        .catch(() => {
          if (!ac.signal.aborted) setAddress(null);
        })
        .finally(() => {
          if (!ac.signal.aborted) setLoading(false);
        });
    }, 400);

    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, [lat, lng, enabled, locale]);

  return { address, loading };
}
