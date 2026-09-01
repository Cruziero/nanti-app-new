import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test/ai")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env["GEMINI_API_KEY"];
        if (!key) {
          return new Response(
            JSON.stringify({ ok: false, error: "GEMINI_API_KEY not set" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: "Say hello in 5 words" }] }],
                generationConfig: { maxOutputTokens: 50 },
              }),
            },
          );

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            return new Response(
              JSON.stringify({ ok: false, status: res.status, error: detail.slice(0, 200) }),
              { status: 500, headers: { "content-type": "application/json" } },
            );
          }

          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          return new Response(
            JSON.stringify({ ok: true, response: text }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
