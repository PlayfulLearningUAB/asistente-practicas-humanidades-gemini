
"use client";

import { useState, useRef, useEffect } from "react";

type Role = "user" | "assistant";
type ChatMessage = { role: Role; content: string };

// Render ligero de markdown: encabezados "#" y negritas "**texto**".
// Evita añadir una dependencia nueva solo para esto.
function renderMarkdownLite(text: string) {
  return text.split("\n").map((line, i) => {
    const headerMatch = line.match(/^#{1,6}\s+(.*)/);
    const content = headerMatch ? headerMatch[1] : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      return boldMatch ? <strong key={j}>{boldMatch[1]}</strong> : part;
    });
    return (
      <span key={i} className={headerMatch ? "font-semibold" : undefined}>
        {parts}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hola, estudiante del máster de Humanidades y Patrimonio Digital.\n\n" +
    "Estoy aquí para ayudarte a explorar las entidades disponibles este curso y a identificar tres opciones de centros de prácticas que puedan ajustarse a tus intereses, preferencias y objetivos formativos.\n\n" +
    "Estas tres opciones son una selección inicial que podrás comentar con la coordinadora de prácticas, la Dra. Paloma Valdivia, antes de decidir.\n\n" +
    "Para empezar, cuéntame qué te gustaría encontrar en tu experiencia de prácticas.",
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // El saludo inicial es solo de interfaz (ya está cubierto por el prompt de
      // sistema); no se envía como turno real a la API, que exige empezar en "user".
      const apiMessages = nextMessages.filter((m) => m !== INITIAL_ASSISTANT_MESSAGE);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");
      setMessages([...nextMessages, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-8">
      <div className="flex w-full max-w-2xl flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm">
        <header className="border-b border-zinc-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">
            Asistente de prácticas — Humanidades y Patrimonio Digital
          </h1>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4" style={{ maxHeight: "65vh" }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-900"
                }`}
              >
                {m.role === "assistant" ? renderMarkdownLite(m.content) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
                Escribiendo…
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-zinc-200 px-4 py-3">
          <input
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            placeholder="Escribe tu respuesta…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

