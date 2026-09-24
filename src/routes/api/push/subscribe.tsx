import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            endpoint?: unknown;
            keys?: { p256dh?: unknown; auth?: unknown };
          };
          const endpoint =
            typeof body.endpoint === "string" ? body.endpoint.trim() : "";
          const p256dh =
            typeof body.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
          const auth =
            typeof body.keys?.auth === "string" ? body.keys.auth.trim() : "";

          if (
            !endpoint ||
            endpoint.length > 4096 ||
            !/^https:\/\//i.test(endpoint) ||
            p256dh.length < 8 ||
            p256dh.length > 1024 ||
            auth.length < 8 ||
            auth.length > 1024
          ) {
            return json({ error: "Invalid push subscription" }, 400);
          }

          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return json({ error: "Unauthorized" }, 401);
          }

          const token = authHeader.slice("Bearer ".length).trim();
          const supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            { auth: { persistSession: false, autoRefreshToken: false } },
          );

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser(token);

          if (userError || !user) {
            return json({ error: "Unauthorized" }, 401);
          }

          const { data: existing, error: lookupError } = await supabase
            .from("push_subscriptions")
            .select("id,user_id")
            .eq("endpoint", endpoint)
            .maybeSingle();
          if (lookupError) throw lookupError;

          if (existing && existing.user_id !== user.id) {
            // Never let an authenticated account take ownership of a browser
            // endpoint that is already bound to another account.
            return json({ error: "Push subscription conflict" }, 409);
          }

          if (existing) {
            const { error } = await supabase
              .from("push_subscriptions")
              .update({
                p256dh,
                auth,
                user_agent: request.headers.get("user-agent") || "web",
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id)
              .eq("user_id", user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("push_subscriptions").insert({
              user_id: user.id,
              endpoint,
              p256dh,
              auth,
              user_agent: request.headers.get("user-agent") || "web",
            });
            if (error) throw error;
          }

          return json({ success: true });
        } catch (error) {
          console.error("Push subscription save failed:", error);
          return json({ error: "Failed to save subscription" }, 500);
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
