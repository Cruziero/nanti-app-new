import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/gmail")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { gmailAdmin, gmailConfig, sameState, sealToken, GMAIL_SCOPE } =
          await import("@/lib/nanti-gmail.server");
        const url = new URL(request.url);
        const state = url.searchParams.get("state") || "";
        const cookie =
          request.headers
            .get("cookie")
            ?.split(";")
            .map((s) => s.trim())
            .find((s) => s.startsWith("nanti_gmail_state="))
            ?.slice("nanti_gmail_state=".length) || "";
        const headers = {
          "Set-Cookie":
            "nanti_gmail_state=; Path=/api/auth/gmail; HttpOnly; SameSite=Lax; Max-Age=0",
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        };
        let workspaceId = "";
        const finish = (result: string) =>
          Response.redirect(
            new URL(
              `/app/settings?gmail=${encodeURIComponent(result)}${workspaceId ? `&email_workspace=${workspaceId}` : ""}#gmail`,
              url.origin,
            ),
            303,
          );
        const reply = (result: string) => {
          const response = finish(result);
          return new Response(null, {
            status: response.status,
            headers: { ...headers, Location: response.headers.get("Location")! },
          });
        };
        if (!state || !cookie || !sameState(state, cookie)) return reply("invalid_state");
        try {
          const { clientId, clientSecret, redirectUri, origin } = gmailConfig();
          if (url.origin !== origin) return reply("invalid_callback");
          const db = gmailAdmin();
          const { data: record, error } = await db
            .from("gmail_oauth_states")
            .delete()
            .eq("state", state)
            .gt("expires_at", new Date().toISOString())
            .select("user_id,workspace_id")
            .maybeSingle();
          if (error || !record) return reply("expired_state");
          workspaceId = record.workspace_id;
          if (url.searchParams.has("error")) return reply("cancelled");
          const code = url.searchParams.get("code");
          if (!code) return reply("missing_code");
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            signal: AbortSignal.timeout(15000),
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              code,
              grant_type: "authorization_code",
            }),
          });
          if (!tokenResponse.ok) return reply("token_exchange_failed");
          const tokens = await tokenResponse.json();
          if (
            !tokens.access_token ||
            !tokens.refresh_token ||
            !String(tokens.scope || "")
              .split(" ")
              .includes(GMAIL_SCOPE)
          )
            return reply("missing_permission");
          const profileResponse = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
            {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
              signal: AbortSignal.timeout(15000),
            },
          );
          if (!profileResponse.ok) return reply("profile_failed");
          const profile = await profileResponse.json();
          if (typeof profile.emailAddress !== "string" || !profile.emailAddress)
            return reply("profile_failed");
          const email = profile.emailAddress.toLowerCase();
          const binding = `${record.user_id}:${record.workspace_id}:${email}`;
          const { error: saveError } = await db.from("gmail_connections").upsert(
            {
              user_id: record.user_id,
              workspace_id: record.workspace_id,
              email,
              status: "connected",
              refresh_token_encrypted: sealToken(tokens.refresh_token, binding),
              connected_at: new Date().toISOString(),
            },
            { onConflict: "workspace_id,email" },
          );
          return reply(saveError ? "save_failed" : "connected");
        } catch {
          return reply("connection_failed");
        }
      },
    },
  },
});
