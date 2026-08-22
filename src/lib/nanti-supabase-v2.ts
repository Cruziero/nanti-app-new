import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ============================================================
// User Preferences
// ============================================================
export const fetchUserPreferences = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
);

export const upsertUserPreferences = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        preferred_name: z.string().min(1).max(100).optional(),
        language: z.enum(["indonesian", "english", "mix"]).optional(),
        tone: z
          .enum([
            "formal",
            "professional",
            "casual",
            "friendly",
            "warm",
            "loving",
            "direct",
            "custom",
          ])
          .optional(),
        focus_area: z.enum(["work", "business", "personal", "everything"]).optional(),
        emoji_preference: z.boolean().optional(),
        verbosity: z.enum(["concise", "normal", "detailed"]).optional(),
        quiet_hours_start: z.string().optional(),
        quiet_hours_end: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (existing) {
      const { error } = await supabase
        .from("user_preferences")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("user_preferences")
        .insert({ ...data, user_id: userId } as never);
      if (error) throw error;
    }
  });

// ============================================================
// Reminder Preferences
// ============================================================
export const fetchReminderPreferences = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("reminder_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
);

export const upsertReminderPreferences = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        whatsapp_enabled: z.boolean().optional(),
        push_enabled: z.boolean().optional(),
        calendar_enabled: z.boolean().optional(),
        in_app_enabled: z.boolean().optional(),
        default_intensity: z.enum(["gentle", "normal", "persistent"]).optional(),
        default_reminder_time: z.string().optional(),
        daily_briefing_time: z.string().optional(),
        end_of_day_time: z.string().optional(),
        quiet_hours_enabled: z.boolean().optional(),
        quiet_hours_start: z.string().optional(),
        quiet_hours_end: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: existing } = await supabase
      .from("reminder_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (existing) {
      const { error } = await supabase
        .from("reminder_preferences")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("reminder_preferences")
        .insert({ ...data, user_id: userId } as never);
      if (error) throw error;
    }
  });

// ============================================================
// Reminders
// ============================================================
export const fetchReminders = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data;
});

export const createReminder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        item_id: z.string().uuid(),
        stage: z.enum(["preparation", "due", "checkin", "overdue"]),
        channel: z.enum(["whatsapp", "push", "calendar", "in_app"]),
        scheduled_at: z.string(),
        idempotency_key: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: reminder, error } = await supabase
      .from("reminders")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return reminder;
  });

export const updateReminder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z
          .enum(["scheduled", "sent", "delivered", "read", "failed", "cancelled"])
          .optional(),
        sent_at: z.string().optional(),
        provider_message_id: z.string().optional(),
        error: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("reminders")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const fetchPendingReminders = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data;
});

// ============================================================
// Notifications
// ============================================================
export const fetchNotifications = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
});

export const createNotification = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        type: z.enum([
          "due_soon",
          "due_today",
          "overdue",
          "waiting_too_long",
          "potentially_forgotten",
          "ai_clarification",
          "followup_suggestion",
          "daily_briefing",
          "invoice_due",
        ]),
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(1000),
        channel: z.enum(["whatsapp", "push", "calendar", "in_app"]),
        scheduled_at: z.string(),
        item_id: z.string().uuid().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return notification;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString(), status: "read" })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

// ============================================================
// Invoices
// ============================================================
export const fetchInvoices = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createInvoiceRow = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        invoice_number: z.string().min(1).max(50),
        client_name: z.string().min(1).max(200),
        client_address: z.string().max(500).optional(),
        client_id: z.string().uuid().optional(),
        business_name: z.string().max(200).optional(),
        business_address: z.string().max(500).optional(),
        date: z.string(),
        due_date: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            amount: z.number(),
          }),
        ),
        subtotal: z.number(),
        discount: z.number().optional(),
        tax: z.number().optional(),
        tax_rate: z.number().optional(),
        total: z.number(),
        currency: z.string().optional(),
        status: z
          .enum([
            "draft",
            "sent",
            "viewed",
            "due_soon",
            "due_today",
            "overdue",
            "paid",
            "cancelled",
          ])
          .optional(),
        notes: z.string().max(2000).optional(),
        payment_details: z.string().max(1000).optional(),
        bank_details: z.string().max(1000).optional(),
        template: z.enum(["minimal", "modern", "premium"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({ ...data, user_id: userId, items: data.items as never })
      .select()
      .single();
    if (error) throw error;
    return invoice;
  });

export const updateInvoiceRow = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z
          .enum([
            "draft",
            "sent",
            "viewed",
            "due_soon",
            "due_today",
            "overdue",
            "paid",
            "cancelled",
          ])
          .optional(),
        client_name: z.string().min(1).max(200).optional(),
        due_date: z.string().optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("invoices")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

// ============================================================
// Calendar Connections
// ============================================================
export const fetchCalendarConnections = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },
);

// ============================================================
// WhatsApp Connections
// ============================================================
export const fetchWhatsAppConnections = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },
);

// ============================================================
// Daily Briefings
// ============================================================
export const fetchDailyBriefing = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ date: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: briefing, error } = await supabase
      .from("daily_briefings")
      .select("*")
      .eq("user_id", userId)
      .eq("date", data.date)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return briefing;
  });

export const upsertDailyBriefing = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        date: z.string(),
        briefing: z.record(z.unknown()),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: existing } = await supabase
      .from("daily_briefings")
      .select("id")
      .eq("user_id", userId)
      .eq("date", data.date)
      .single();
    if (existing) {
      const { error } = await supabase
        .from("daily_briefings")
        .update({ briefing: data.briefing })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("daily_briefings")
        .insert({ user_id: userId, date: data.date, briefing: data.briefing });
      if (error) throw error;
    }
  });
