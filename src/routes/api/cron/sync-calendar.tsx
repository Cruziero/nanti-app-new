import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/cron/sync-calendar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );

          const { data: integrations } = await supabase
            .from("calendar_integrations")
            .select("*")
            .eq("provider", "google")
            .eq("sync_enabled", true);

          if (!integrations)
            return new Response(JSON.stringify({ synced: 0 }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });

          let synced = 0;

          for (const integration of integrations) {
            try {
              const now = new Date();
              const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
              const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

              let accessToken = integration.access_token;

              if (new Date(integration.token_expiry) < now) {
                const refreshed = await refreshGoogleToken(integration.refresh_token);
                if (!refreshed) {
                  await supabase
                    .from("calendar_integrations")
                    .update({ sync_enabled: false })
                    .eq("user_id", integration.user_id);
                  continue;
                }
                accessToken = refreshed.access_token;

                await supabase
                  .from("calendar_integrations")
                  .update({
                    access_token: refreshed.access_token,
                    token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                  })
                  .eq("user_id", integration.user_id);
              }

              const eventsResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(integration.calendar_id || "primary")}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                },
              );

              if (!eventsResponse.ok) continue;

              const eventsData = await eventsResponse.json();
              const events = eventsData.items || [];

              for (const event of events) {
                const startDate = event.start?.date || event.start?.dateTime;
                const endDate = event.end?.date || event.end?.dateTime;

                if (!startDate) continue;

                await supabase.from("calendar_events").upsert(
                  {
                    user_id: integration.user_id,
                    provider: "google",
                    external_event_id: event.id,
                    title: event.summary || "Untitled",
                    description: event.description || "",
                    start_date: startDate,
                    end_date: endDate,
                    location: event.location || "",
                    attendees: event.attendees?.map((a: { email: string }) => a.email) || [],
                    raw_json: event,
                  },
                  { onConflict: "user_id,external_event_id" },
                );
              }

              await supabase
                .from("calendar_integrations")
                .update({ last_synced_at: now.toISOString() })
                .eq("user_id", integration.user_id);

              synced++;
            } catch (err) {
              console.error(`Calendar sync error for user ${integration.user_id}:`, err);
            }
          }

          return new Response(JSON.stringify({ synced, timestamp: new Date().toISOString() }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Calendar sync cron error:", error);
          return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
    };
  } catch {
    return null;
  }
}
