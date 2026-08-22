import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          return redirect({
            to: "/app/settings",
            search: { calendar_error: error },
          });
        }

        if (!code) {
          const clientId = process.env.GOOGLE_CLIENT_ID;
          const redirectUri = `${url.origin}/api/auth/google`;
          const scopes = [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" ");

          const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          authUrl.searchParams.set("client_id", clientId || "");
          authUrl.searchParams.set("redirect_uri", redirectUri);
          authUrl.searchParams.set("response_type", "code");
          authUrl.searchParams.set("scope", scopes);
          authUrl.searchParams.set("access_type", "offline");
          authUrl.searchParams.set("prompt", "consent");
          authUrl.searchParams.set("state", state || "");

          return redirect({
            href: authUrl.toString(),
          });
        }

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            redirect_uri: `${url.origin}/api/auth/google`,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenResponse.ok) {
          return redirect({
            to: "/app/settings",
            search: { calendar_error: "token_exchange_failed" },
          });
        }

        const tokens = await tokenResponse.json();

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        );

        const userId = state || "";

        if (userId) {
          await supabase.from("calendar_integrations").upsert({
            user_id: userId,
            provider: "google",
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            calendar_id: "primary",
          });

          await supabase.from("user_integrations").upsert(
            {
              user_id: userId,
              provider: "google_calendar",
              enabled: true,
            },
            { onConflict: "user_id,provider" },
          );
        }

        return redirect({
          to: "/app/settings",
          search: { calendar_connected: "true" },
        });
      },
    },
  },
});
