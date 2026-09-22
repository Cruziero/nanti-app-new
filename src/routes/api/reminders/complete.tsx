import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/reminders/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

          const { itemId } = await request.json();
          if (!itemId) return json({ error: "itemId is required" }, 400);

          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );
          const token = authHeader.slice("Bearer ".length);
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user) return json({ error: "Unauthorized" }, 401);

          const { data, error } = await supabase
            .from("tasks")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .eq("id", itemId)
            .eq("user_id", user.id)
            .select("id")
            .single();
          if (error) throw error;
          return json({ success: true, itemId: data.id });
        } catch (error) {
          console.error("Reminder complete error:", error);
          return json({ error: "Failed to complete item" }, 500);
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
