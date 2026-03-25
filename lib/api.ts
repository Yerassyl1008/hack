const DEFAULT_API =
  "https://8d6a-95-141-135-226.ngrok-free.app";

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API;
  return raw.replace(/\/$/, "");
}

export type AnalysisPayload = {
  category: string;
  title: string;
  description: string;
  confidenceLabel?: string;
  ecoFact?: string;
};

function extractAnalysis(data: unknown): AnalysisPayload | null {
  if (data == null) return null;
  let root: Record<string, unknown>;
  if (typeof data === "string") {
    try {
      const p = JSON.parse(data) as unknown;
      root = typeof p === "object" && p !== null ? (p as Record<string, unknown>) : {};
    } catch {
      return {
        category: "—",
        title: "Ответ",
        description: data,
      };
    }
  } else if (typeof data === "object") {
    root = data as Record<string, unknown>;
  } else {
    return null;
  }

  const a =
    root.analysis && typeof root.analysis === "object"
      ? (root.analysis as Record<string, unknown>)
      : root;

  const conf =
    a.confidence ?? a.confidence_score ?? a.score ?? root.confidence;
  let confidenceLabel: string | undefined;
  if (conf != null && conf !== "") {
    if (typeof conf === "number") {
      confidenceLabel =
        conf >= 0 && conf <= 1
          ? `${Math.round(conf * 100)}%`
          : `${Math.round(conf)}%`;
    } else {
      confidenceLabel = String(conf);
    }
  }

  return {
    category: String(a.category ?? a.material_type ?? a.type ?? "—"),
    title: String(a.problem ?? a.material ?? a.title ?? a.label ?? "—"),
    description: String(
      a.recommendation ?? a.instruction ?? a.description ?? ""
    ),
    confidenceLabel,
    ecoFact:
      a.eco_fact != null
        ? String(a.eco_fact)
        : a.ecoFact != null
          ? String(a.ecoFact)
          : undefined,
  };
}

/**
 * Клиент всегда ходит на свой origin `/api/analyze-image` (прокси в `app/api`),
 * чтобы не ловить CORS / Failed to fetch на ngrok.
 */
function analyzeEndpoint(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/analyze-image`;
  }
  return `${getApiBaseUrl()}/analyze-image`;
}

export async function analyzeImage(
  file: File,
  lat: number,
  lng: number
): Promise<{ raw: unknown; analysis: AnalysisPayload | null }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lat", String(lat));
  formData.append("lng", String(lng));

  const res = await fetch(analyzeEndpoint(), {
    method: "POST",
    body: formData,
  });

  const text = await res.text();
  let raw: unknown = text;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    /* оставляем строку */
  }

  if (!res.ok) {
    const detail =
      typeof raw === "object" && raw !== null && "detail" in raw
        ? JSON.stringify((raw as { detail: unknown }).detail)
        : text;
    throw new Error(detail || `Ошибка ${res.status}`);
  }

  return {
    raw,
    analysis: extractAnalysis(raw),
  };
}
