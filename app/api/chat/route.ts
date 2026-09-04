
import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/system-prompt";

const MODEL = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_RETRIES = 3;

type ChatMessage = { role: "user" | "assistant"; content: string };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages requerido" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar GEMINI_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  const contents = (messages as ChatMessage[]).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let response: Response | null = null;
  let errText = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    if (response.ok) break;

    // Solo reintentamos si el modelo está saturado (503); otros errores no mejoran con reintentos.
    if (response.status !== 503 || attempt === MAX_RETRIES) {
      errText = await response.text();
      break;
    }

    await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
  }

  if (!response || !response.ok) {
    return NextResponse.json(
      { error: `Error de la API de Gemini: ${errText}` },
      { status: response?.status ?? 500 }
    );
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ?? "";

  return NextResponse.json({ text });
}



