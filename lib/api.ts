const DEFAULT_API = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  const raw =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API;
  return raw.replace(/\/$/, "");
}

export type AnalysisPayload = {
  category: string;
  title: string;
  description: string;
  urgency?: string;
  confidenceLabel?: string;
  ecoFact?: string;
};

export type AnalyzeStatus = "success" | "rejected" | "unknown";

function asObject(data: unknown): Record<string, unknown> | null {
  if (data == null) return null;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return typeof data === "object" ? (data as Record<string, unknown>) : null;
}

function extractAnalysis(data: unknown): AnalysisPayload | null {
  if (typeof data === "string") {
    try {
      JSON.parse(data);
    } catch {
      return {
        category: "—",
        title: "Ответ",
        description: data,
      };
    }
  }

  const root = asObject(data);
  if (!root) return null;

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
    urgency:
      a.urgency != null && a.urgency !== ""
        ? String(a.urgency)
        : undefined,
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
): Promise<{
  raw: unknown;
  analysis: AnalysisPayload | null;
  status: AnalyzeStatus;
  message?: string;
  incidentId: number | null;
}> {
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

  const root = asObject(raw);
  const status =
    root?.status === "success" || root?.status === "rejected"
      ? root.status
      : "unknown";
  const message =
    typeof root?.message === "string" ? root.message : undefined;
  const incidentId =
    typeof root?.incident_id === "number" ? root.incident_id : null;

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
    status,
    message,
    incidentId,
  };
}
