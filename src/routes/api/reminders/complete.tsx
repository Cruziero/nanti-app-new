import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/reminders/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { itemId } = await request.json();

          if (!itemId) {
            return new Response(JSON.stringify({ error: "itemId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
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

          return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (error) {
          return new Response(JSON.stringify({ error: "Failed to complete item" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
