import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { endpoint, keys } = body;

          if (!endpoint) {
            return new Response(JSON.stringify({ error: "endpoint is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.replace("Bearer ", "");
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          await supabase.from("push_subscriptions").upsert(
            {
              user_id: user.id,
              endpoint,
              p256dh: keys?.p256dh || "",
              auth: keys?.auth || "",
              user_agent: request.headers.get("user-agent") || "web",
            },
            { onConflict: "endpoint" },
          );

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: "Failed to save subscription" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
