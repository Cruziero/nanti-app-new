import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { readAllExportPages } from "./nanti-export-pages";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function adminClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase service configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const exportMyNantiData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase, claims } = context;
    const admin = adminClient();

    const [
      tasks,
      waiting,
      inbox,
      people,
      personActivity,
      projects,
      conversations,
      messages,
      settings,
      languageMemory,
      aliases,
      routines,
      notifications,
      briefings,
      productEvents,
      calendarEvents,
      calendarConnection,
    ] = await Promise.all([
      readAllExportPages((from, to) =>
        supabase.from("tasks").select("*").eq("user_id", userId).order("id").range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("waiting_items")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase.from("inbox_items").select("*").eq("user_id", userId).order("id").range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase.from("people").select("*").eq("user_id", userId).order("id").range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("person_activity")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase.from("projects").select("*").eq("user_id", userId).order("id").range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("conversations")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase.from("ai_messages").select("*").eq("user_id", userId).order("id").range(from, to),
      ),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      readAllExportPages((from, to) =>
        supabase
          .from("user_language_memory")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("entity_aliases")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("user_routines")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("daily_briefings")
          .select("*")
          .eq("user_id", userId)
          .order("brief_date")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("product_events")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      readAllExportPages((from, to) =>
        supabase
          .from("calendar_events")
          .select("*")
          .eq("user_id", userId)
          .order("id")
          .range(from, to),
      ),
      admin
        .from("calendar_connections")
        .select(
          "provider,status,sync_enabled,calendar_id,connected_at,last_synced_at,created_at,updated_at",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const results = [
      tasks,
      waiting,
      inbox,
      people,
      personActivity,
      projects,
      conversations,
      messages,
      settings,
      languageMemory,
      aliases,
      routines,
      notifications,
      briefings,
      productEvents,
      calendarEvents,
      calendarConnection,
    ];
    const firstError = results.find((result) => result.error)?.error;
    if (firstError) throw firstError;

    return {
      exported_at: new Date().toISOString(),
      account: {
        id: userId,
        email: typeof claims.email === "string" ? claims.email : null,
      },
      data: {
        tasks: tasks.data || [],
        waiting_items: waiting.data || [],
        inbox_items: inbox.data || [],
        people: people.data || [],
        person_activity: personActivity.data || [],
        projects: projects.data || [],
        conversations: conversations.data || [],
        ai_messages: messages.data || [],
        user_settings: settings.data || null,
        user_language_memory: languageMemory.data || [],
        entity_aliases: aliases.data || [],
        user_routines: routines.data || [],
        notifications: notifications.data || [],
        daily_briefings: briefings.data || [],
        product_events: productEvents.data || [],
        calendar_events: calendarEvents.data || [],
        calendar_connection: calendarConnection.data || null,
      },
    };
  });

export const deleteMyNantiAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        confirmation: z.literal("DELETE MY ACCOUNT"),
      })
      .parse(data),
  )
  .handler(async ({ context }) => {
    const { userId } = context;
    const admin = adminClient();

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return { deleted: true };
  });
