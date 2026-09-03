import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug/server-info")({
  server: {
    handlers: {
      GET: async () => {
        const info: Record<string, unknown> = {
          nodeVersion: process.version,
          platform: process.platform,
          env: {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
            GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
          },
          timestamp: new Date().toISOString(),
        };

        try {
          const mod = await import("nitropack/runtime");
          info.nitroRuntime = "available";
        } catch (e: unknown) {
          info.nitroRuntime = String(e);
        }

        return new Response(JSON.stringify(info, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
