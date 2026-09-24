import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { syncGoogleCalendarForUser } from "@/lib/nanti-calendar.functions";

export const Route = createFileRoute("/api/cron/sync-calendar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (
            !process.env.CRON_SECRET ||
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
          ) {
            return json({ error: "Unauthorized" }, 401);
          }

          const supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            { auth: { persistSession: false, autoRefreshToken: false } },
          );

          const { data: connections, error } = await supabase
            .from("calendar_connections")
            .select("user_id")
            .eq("provider", "google")
            .eq("sync_enabled", true)
            .eq("status", "connected");
          if (error) throw error;

          let synced = 0;
          const failures: string[] = [];
          for (const connection of connections || []) {
            try {
              await syncGoogleCalendarForUser(connection.user_id, supabase);
              synced++;
            } catch (syncError) {
              failures.push(connection.user_id);
              console.error("Calendar sync failed:", syncError);
            }
          }

          return json({
            synced,
            failed: failures.length,
            total: connections?.length || 0,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Calendar sync cron error:", error);
          return json({ error: "Internal error" }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
