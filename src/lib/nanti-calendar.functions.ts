import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AdminClient = ReturnType<typeof createClient>;

function adminClient() {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase service configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function googleConfig() {
  const clientId = process.env["GOOGLE_CLIENT_ID"] || "";
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"] || "";
  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar is not configured on this deployment.");
  }
  return { clientId, clientSecret };
}

export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        origin: z
          .string()
          .url()
          .refine((value) => /^https?:\/\//i.test(value), "Invalid app origin"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { clientId } = googleConfig();
    const supabase = adminClient();
    const state = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

    await supabase.from("calendar_oauth_states").delete().eq("user_id", userId);
    const { error: stateError } = await supabase
      .from("calendar_oauth_states")
      .insert({ state, user_id: userId, expires_at: expiresAt });
    if (stateError) throw stateError;

    const redirectUri = `${data.origin.replace(/\/$/, "")}/api/auth/google`;
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.readonly");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("state", state);

    return { url: authUrl.toString(), expires_at: expiresAt };
  });

export const fetchGoogleCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const supabase = adminClient();
    const { data: connection, error } = await supabase
      .from("calendar_connections")
      .select("provider,status,sync_enabled,calendar_id,connected_at,last_synced_at,updated_at")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();
    if (error) throw error;

    if (!connection) {
      return {
        connected: false,
        status: "disconnected" as const,
        last_synced_at: null,
        next_event: null,
      };
    }

    const now = new Date().toISOString();
    const { data: nextEvent, error: eventError } = await supabase
      .from("calendar_events")
      .select("title,start_date,end_date,location")
      .eq("user_id", userId)
      .gte("start_date", now)
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (eventError) throw eventError;

    return {
      connected: connection.status === "connected" && connection.sync_enabled !== false,
      status: connection.status as "connected" | "failed" | "disconnected",
      last_synced_at: connection.last_synced_at as string | null,
      connected_at: connection.connected_at as string | null,
      next_event: nextEvent || null,
    };
  });

export const syncGoogleCalendarNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => syncGoogleCalendarForUser(context.userId));

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const supabase = adminClient();

    const { error: eventError } = await supabase
      .from("calendar_events")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "google");
    if (eventError) throw eventError;

    const { error: connectionError } = await supabase
      .from("calendar_connections")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "google");
    if (connectionError) throw connectionError;

    await supabase.from("calendar_oauth_states").delete().eq("user_id", userId);
    return { connected: false };
  });

export async function syncGoogleCalendarForUser(
  userId: string,
  suppliedClient?: AdminClient,
) {
  const supabase = suppliedClient || adminClient();
  const { data: connection, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("sync_enabled", true)
    .maybeSingle();
  if (error) throw error;
  if (!connection) throw new Error("Google Calendar is not connected.");

  const now = new Date();
  let accessToken = String(connection.access_token || "");
  let tokenExpiry = connection.token_expiry
    ? new Date(connection.token_expiry)
    : new Date(0);

  if (!accessToken || tokenExpiry.getTime() <= now.getTime() + 60_000) {
    if (!connection.refresh_token) {
      await markCalendarFailed(supabase, userId);
      throw new Error("Google Calendar needs to be reconnected.");
    }
    const refreshed = await refreshGoogleToken(String(connection.refresh_token));
    accessToken = refreshed.access_token;
    tokenExpiry = new Date(Date.now() + refreshed.expires_in * 1000);

    const { error: refreshError } = await supabase
      .from("calendar_connections")
      .update({
        access_token: accessToken,
        token_expiry: tokenExpiry.toISOString(),
        status: "connected",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "google");
    if (refreshError) throw refreshError;
  }

  const timeMin = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
  const endpoint = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      String(connection.calendar_id || "primary"),
    )}/events`,
  );
  endpoint.searchParams.set("timeMin", timeMin);
  endpoint.searchParams.set("timeMax", timeMax);
  endpoint.searchParams.set("singleEvents", "true");
  endpoint.searchParams.set("orderBy", "startTime");
  endpoint.searchParams.set("maxResults", "500");

  const events: Array<Record<string, any>> = [];
  let pageToken: string | null = null;

  do {
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken);
    else endpoint.searchParams.delete("pageToken");

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        await markCalendarFailed(supabase, userId);
      }
      console.error("Google Calendar sync failed:", response.status, body.slice(0, 300));
      throw new Error("Google Calendar could not be synced.");
    }

    const body = (await response.json()) as {
      items?: Array<Record<string, any>>;
      nextPageToken?: string;
    };
    if (Array.isArray(body.items)) events.push(...body.items);
    pageToken = body.nextPageToken || null;
  } while (pageToken);

  const normalizedEvents = events.flatMap((event) => {
    const eventId = typeof event.id === "string" ? event.id : "";
    const startDate = event.start?.dateTime || event.start?.date;
    if (!eventId || !startDate || event.status === "cancelled") return [];

    const attendees = Array.isArray(event.attendees)
      ? event.attendees
          .map((attendee: any) =>
            typeof attendee?.email === "string" ? attendee.email : "",
          )
          .filter(Boolean)
          .slice(0, 100)
      : [];

    return [{
      user_id: userId,
      provider: "google",
      external_event_id: eventId,
      title:
        typeof event.summary === "string" && event.summary.trim()
          ? event.summary.trim()
          : "Untitled event",
      description:
        typeof event.description === "string"
          ? event.description.slice(0, 10000)
          : "",
      start_date: String(startDate),
      end_date: event.end?.dateTime || event.end?.date || null,
      location:
        typeof event.location === "string"
          ? event.location.slice(0, 1000)
          : "",
      attendees,
      raw_json: event,
      updated_at: new Date().toISOString(),
    }];
  });

  // This table is only a rolling schedule cache. Replacing the Google snapshot
  // removes cancelled/deleted events instead of leaving stale AI memory behind.
  const { error: clearError } = await supabase
    .from("calendar_events")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "google");
  if (clearError) throw clearError;

  for (let index = 0; index < normalizedEvents.length; index += 200) {
    const batch = normalizedEvents.slice(index, index + 200);
    if (!batch.length) continue;
    const { error: insertError } = await supabase
      .from("calendar_events")
      .insert(batch);
    if (insertError) throw insertError;
  }

  const saved = normalizedEvents.length;

  const syncedAt = new Date().toISOString();
  const { error: connectionError } = await supabase
    .from("calendar_connections")
    .update({
      status: "connected",
      last_synced_at: syncedAt,
      updated_at: syncedAt,
    })
    .eq("user_id", userId)
    .eq("provider", "google");
  if (connectionError) throw connectionError;

  return { connected: true, synced: saved, last_synced_at: syncedAt };
}

async function refreshGoogleToken(refreshToken: string) {
  const { clientId, clientSecret } = googleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    console.error(
      "Google token refresh failed:",
      response.status,
      (await response.text().catch(() => "")).slice(0, 300),
    );
    throw new Error("Google Calendar needs to be reconnected.");
  }
  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error("Google token refresh returned no access token.");
  }
  return {
    access_token: data.access_token,
    expires_in: Number(data.expires_in || 3600),
  };
}

async function markCalendarFailed(supabase: AdminClient, userId: string) {
  await supabase
    .from("calendar_connections")
    .update({
      status: "failed",
      sync_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "google");
}
