import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/push/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
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
          if (userError || !user) return json({ error: "Unauthorized" }, 401);

          const publicKey =
            process.env.VAPID_PUBLIC_KEY ||
            process.env.VITE_VAPID_PUBLIC_KEY ||
            "";
          const privateKey = process.env.VAPID_PRIVATE_KEY || "";
          if (!publicKey || !privateKey) {
            return json({ error: "Push is not configured" }, 503);
          }

          const { data: subscriptions, error } = await supabase
            .from("push_subscriptions")
            .select("endpoint,p256dh,auth")
            .eq("user_id", user.id);
          if (error) throw error;
          if (!subscriptions?.length) {
            return json({ error: "No push subscription found" }, 409);
          }

          const webpush = await import("web-push");
          webpush.setVapidDetails(
            "mailto:noreply@nanti-app.com",
            publicKey,
            privateKey,
          );

          let sent = 0;
          let stale = 0;
          for (const subscription of subscriptions) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                  },
                },
                JSON.stringify({
                  title: "NANTI notifications are ready",
                  body: "This is a test reminder from your NANTI account.",
                  tag: "nanti-test-notification",
                  data: { url: "/app/settings" },
                }),
              );
              sent++;
            } catch (pushError: unknown) {
              const statusCode = (pushError as { statusCode?: number }).statusCode;
              if (statusCode === 404 || statusCode === 410) {
                stale++;
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", subscription.endpoint)
                  .eq("user_id", user.id);
              } else {
                console.error("Push test delivery failed:", pushError);
              }
            }
          }

          if (!sent) {
            return json(
              {
                error: stale
                  ? "Your saved browser subscription expired. Disable and enable Push again."
                  : "Test notification could not be delivered.",
                stale,
              },
              502,
            );
          }

          return json({ success: true, sent, stale });
        } catch (error) {
          console.error("Push test failed:", error);
          return json({ error: "Push test failed" }, 500);
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
