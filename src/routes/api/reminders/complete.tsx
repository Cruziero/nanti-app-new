import { createFileRoute, json } from "@tanstack/react-router";

export const Route = createFileRoute("/api/reminders/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { itemId } = await request.json();

          if (!itemId) {
            return json({ error: "itemId is required" }, { status: 400 });
          }

          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );

          await supabase
            .from("items")
            .update({ status: "done", completed_at: new Date().toISOString() })
            .eq("id", itemId);

          await supabase.from("reminders").update({ enabled: false }).eq("item_id", itemId);

          return json({ success: true });
        } catch (error) {
          return json({ error: "Failed to complete item" }, { status: 500 });
        }
      },
    },
  },
});
