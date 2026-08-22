import { createFileRoute, json } from "@tanstack/react-router";

export const Route = createFileRoute("/api/reminders/snooze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { itemId, minutes } = await request.json();

          if (!itemId) {
            return json({ error: "itemId is required" }, { status: 400 });
          }

          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );

          const snoozeUntil = new Date(Date.now() + (minutes || 60) * 60 * 1000).toISOString();

          await supabase
            .from("reminders")
            .update({ snooze_until: snoozeUntil })
            .eq("item_id", itemId);

          return json({ success: true, snoozeUntil });
        } catch (error) {
          return json({ error: "Failed to snooze reminder" }, { status: 500 });
        }
      },
    },
  },
});
