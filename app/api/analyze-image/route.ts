import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND =
  "https://8d6a-95-141-135-226.ngrok-free.app";

function backendBase(): string {
  const raw =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_BACKEND;
  return raw.replace(/\/$/, "");
}

/**
 * Прокси на бэкенд: браузер бьёт в /api/analyze-image (same-origin),
 * сервер пересылает multipart на ngrok — обходит CORS и часть блокировок.
 */
export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { detail: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const target = `${backendBase()}/analyze-image`;

  try {
    /** Ngrok отдаёт HTML-страницу-заглушку, если не передать skip (и иногда без «браузерного» UA). */
    const upstream = await fetch(target, {
      method: "POST",
      body: formData,
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const text = await upstream.text();
    const ct =
      upstream.headers.get("content-type") ?? "application/json; charset=utf-8";

    if (
      ct.includes("text/html") ||
      (text.trimStart().startsWith("<!") && text.includes("ngrok"))
    ) {
      console.error(
        "[analyze-image proxy] ngrok вернул HTML вместо API. Проверьте туннель и BACKEND_API_URL."
      );
      return NextResponse.json(
        {
          detail:
            "Бэкенд вернул HTML (часто это страница-предупреждение ngrok). Убедитесь, что туннель запущен, URL в .env верный, на бэкенде открыт POST /analyze-image.",
        },
        { status: 502 }
      );
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": ct },
    });
  } catch (e) {
    console.error("[analyze-image proxy]", e);
    return NextResponse.json(
      {
        detail:
          e instanceof Error
            ? e.message
            : "Не удалось связаться с сервером анализа",
      },
      { status: 502 }
    );
  }
}
