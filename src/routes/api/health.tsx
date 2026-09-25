import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function configured(value: string | undefined) {
  return Boolean(value && value.trim());
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        const provided = (request.headers.get("Authorization") || "").replace(
          /^Bearer\s+/i,
          "",
        );
        const detailed = Boolean(secret && provided && provided === secret);

        const base = {
          ok: true,
          service: "nanti",
          timestamp: new Date().toISOString(),
        };

        if (!detailed) return json(base);

        return json({
          ...base,
          checks: {
            supabase:
              configured(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
              configured(process.env.SUPABASE_SERVICE_ROLE_KEY),
            ai: configured(process.env.GEMINI_API_KEY),
            aiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
            aiFallbackModel:
              process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite",
            aiPrivacyReady: process.env.GEMINI_PAID_TIER === "true",
            googleCalendar:
              configured(process.env.GOOGLE_CLIENT_ID) &&
              configured(process.env.GOOGLE_CLIENT_SECRET),
            push:
              configured(process.env.VAPID_PUBLIC_KEY) &&
              configured(process.env.VAPID_PRIVATE_KEY),
            cron: configured(process.env.CRON_SECRET),
          },
        });
      },
    },
  },
});
