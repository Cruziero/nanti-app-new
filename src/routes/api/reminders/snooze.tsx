import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/reminders/snooze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

          const { itemId, minutes } = await request.json();
          if (!itemId) return json({ error: "itemId is required" }, 400);
          const delayMinutes = Math.min(Math.max(Number(minutes) || 60, 5), 24 * 60);
          const reminderTime = new Date(Date.now() + delayMinutes * 60_000).toISOString();

          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );
          const token = authHeader.slice("Bearer ".length);
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user) return json({ error: "Unauthorized" }, 401);

          const { data, error } = await supabase
            .from("tasks")
            .update({
              reminder_enabled: true,
              reminder_time: reminderTime,
              last_reminded_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemId)
            .eq("user_id", user.id)
            .select("id")
            .single();
          if (error) throw error;

          return json({ success: true, itemId: data.id, reminderTime });
        } catch (error) {
          console.error("Reminder snooze error:", error);
          return json({ error: "Failed to snooze reminder" }, 500);
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
