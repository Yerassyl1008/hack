export type MapMarkerSeverity = "normal" | "error";

/** Маркер инцидента на карте (создаётся после анализа/ошибки). */
export type IncidentMapMarker = {
  id: string;
  lat: number;
  lng: number;
  problem: string;
  severity: MapMarkerSeverity;
  /** Unix ms, для списка и сортировки */
  createdAt?: number;
  /** Человекочитаемый адрес (если был известен при создании) */
  address?: string;
  /** Рекомендация от AI (если была в ответе) */
  recommendation?: string;
};

/** Запрос центрирования карты на маркере и открытия его popup */
export type MapFocusRequest = {
  lat: number;
  lng: number;
  zoom: number;
  markerId: string;
  /** Уникальный токен, чтобы повторный клик по той же точке сработал */
  token: number;
};

const STORAGE_KEY = "tech-city:incident-map-markers";

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function loadPersistedMarkers(): IncidentMapMarker[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: IncidentMapMarker[] = [];
    for (const item of parsed) {
      if (item == null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const lat = o.lat;
      const lng = o.lng;
      const problem = typeof o.problem === "string" ? o.problem : null;
      if (!isFiniteNum(lat) || !isFiniteNum(lng) || problem == null) continue;

      const id =
        typeof o.id === "string" && o.id.length > 0
          ? o.id
          : `leg-${lat}-${lng}-${problem.slice(0, 40)}`;
      const sev =
        o.severity === "error" || o.severity === "normal" ? o.severity : "normal";
      const createdAt =
        typeof o.createdAt === "number" && Number.isFinite(o.createdAt)
          ? o.createdAt
          : undefined;
      const address =
        typeof o.address === "string" && o.address.trim() !== ""
          ? o.address.trim()
          : undefined;
      const recommendation =
        typeof o.recommendation === "string" && o.recommendation.trim() !== ""
          ? o.recommendation.trim()
          : undefined;

      out.push({
        id,
        lat,
        lng,
        problem,
        severity: sev,
        ...(createdAt != null ? { createdAt } : {}),
        ...(address != null ? { address } : {}),
        ...(recommendation != null ? { recommendation } : {}),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function savePersistedMarkers(markers: IncidentMapMarker[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch {
    /* ignore quota / private mode */
  }
}

export function newMarkerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
