import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND =
  "http://127.0.0.1:8010";

function backendBase(): string {
  const raw =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_BACKEND;
  return raw.replace(/\/$/, "");
}

/**
 * Браузер всегда стучится в same-origin `/api/analyze-image`,
 * а Route Handler пересылает multipart в FastAPI backend.
 * Это сохраняет простой клиентский fetch и позволяет при необходимости
 * прокидывать запросы через туннели вроде ngrok без CORS-проблем.
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
        "[analyze-image proxy] backend вернул HTML вместо API. Проверьте BACKEND_API_URL и POST /analyze-image."
      );
      return NextResponse.json(
        {
          detail:
            "Бэкенд вернул HTML вместо JSON. Убедитесь, что URL в .env.local верный и на backend открыт POST /analyze-image.",
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
