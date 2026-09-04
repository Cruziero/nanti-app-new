import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug/server-info")({
  server: {
    handlers: {
      GET: async () => {
        const info: Record<string, unknown> = {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          env: {
            HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
            HAS_SUPABASE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
            HAS_GEMINI_KEY: !!process.env.GEMINI_API_KEY,
          },
        };

        return new Response(JSON.stringify(info, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
