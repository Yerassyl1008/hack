import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

/**
 * Обратное геокодирование (прокси к Nominatim с корректным User-Agent).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lng = Number.parseFloat(searchParams.get("lng") ?? "");
  const lang = (searchParams.get("lang") ?? "ru").slice(0, 10);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid lat/lng" }, { status: 400 });
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "out of range" }, { status: 400 });
  }

  const upstreamUrl = new URL(NOMINATIM);
  upstreamUrl.searchParams.set("format", "json");
  upstreamUrl.searchParams.set("lat", String(lat));
  upstreamUrl.searchParams.set("lon", String(lng));
  upstreamUrl.searchParams.set("zoom", "18");
  upstreamUrl.searchParams.set("addressdetails", "1");
  upstreamUrl.searchParams.set("accept-language", lang);

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "TechCityMonitor/1.0 (local; reverse-geocode proxy)",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { address: null, error: `upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as { display_name?: string };
    const address =
      typeof data.display_name === "string" && data.display_name.trim() !== ""
        ? data.display_name.trim()
        : null;

    return NextResponse.json({ address });
  } catch (e) {
    console.error("[reverse-geocode]", e);
    return NextResponse.json(
      {
        address: null,
        error: e instanceof Error ? e.message : "fetch failed",
      },
      { status: 502 }
    );
  }
}
