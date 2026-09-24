import { createFileRoute, redirect } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { syncGoogleCalendarForUser } from "@/lib/nanti-calendar.functions";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const oauthError = url.searchParams.get("error");

        if (oauthError) {
          return redirect({
            to: "/app/settings",
            search: { calendar_error: oauthError },
          });
        }

        if (!code || !state) {
          return redirect({
            to: "/app/settings",
            search: { calendar_error: "invalid_oauth_callback" },
          });
        }

        const supabaseUrl =
          process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const clientId = process.env.GOOGLE_CLIENT_ID || "";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
        if (!supabaseUrl || !serviceKey || !clientId || !clientSecret) {
          return redirect({
            to: "/app/settings",
            search: { calendar_error: "calendar_not_configured" },
          });
        }

        const supabase = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: oauthState, error: stateError } = await supabase
          .from("calendar_oauth_states")
          .select("state,user_id,expires_at")
          .eq("state", state)
          .maybeSingle();

        await supabase.from("calendar_oauth_states").delete().eq("state", state);

        if (
          stateError ||
          !oauthState ||
          new Date(oauthState.expires_at).getTime() <= Date.now()
        ) {
          return redirect({
            to: "/app/settings",
            search: { calendar_error: "oauth_state_expired" },
          });
        }

        const redirectUri = `${url.origin}/api/auth/google`;
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenResponse.ok) {
          console.error(
            "Google Calendar token exchange failed:",
            tokenResponse.status,
            (await tokenResponse.text().catch(() => "")).slice(0, 300),
          );
          return redirect({
            to: "/app/settings",
            search: { calendar_error: "token_exchange_failed" },
          });
        }

        const tokens = (await tokenResponse.json()) as {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
        };
        if (!tokens.access_token) {
          return redirect({
            to: "/app/settings",
            search: { calendar_error: "missing_access_token" },
          });
        }

        const { data: existing } = await supabase
          .from("calendar_connections")
          .select("refresh_token")
          .eq("user_id", oauthState.user_id)
          .eq("provider", "google")
          .maybeSingle();

        const refreshToken = tokens.refresh_token || existing?.refresh_token || null;
        const { error: saveError } = await supabase
          .from("calendar_connections")
          .upsert(
            {
              user_id: oauthState.user_id,
              provider: "google",
              access_token: tokens.access_token,
              refresh_token: refreshToken,
              token_expiry: new Date(
                Date.now() + Number(tokens.expires_in || 3600) * 1000,
              ).toISOString(),
              calendar_id: "primary",
              status: "connected",
              sync_enabled: true,
              connected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,provider" },
          );
        if (saveError) {
          console.error("Google Calendar connection save failed:", saveError);
          return redirect({
            to: "/app/settings",
            search: { calendar_error: "connection_save_failed" },
          });
        }

        try {
          await syncGoogleCalendarForUser(oauthState.user_id, supabase);
        } catch (syncError) {
          console.error("Initial Google Calendar sync failed:", syncError);
        }

        return redirect({
          to: "/app/settings",
          search: { calendar_connected: "true" },
        });
      },
    },
  },
});
