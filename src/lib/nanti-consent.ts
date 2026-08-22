import { createClient } from "@supabase/supabase-js";

export interface WhatsAppConsent {
  userId: string;
  enabled: boolean;
  channels: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  allowFollowups: boolean;
  allowBriefings: boolean;
  allowUrgentAlerts: boolean;
  lastUpdated: string;
}

export async function getConsent(userId: string): Promise<WhatsAppConsent | null> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const { data } = await supabase
    .from("whatsapp_consent")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  return {
    userId: data.user_id,
    enabled: data.enabled,
    channels: data.channels || ["whatsapp"],
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    allowFollowups: data.allow_followups ?? true,
    allowBriefings: data.allow_briefings ?? true,
    allowUrgentAlerts: data.allow_urgent_alerts ?? true,
    lastUpdated: data.updated_at,
  };
}

export async function updateConsent(
  userId: string,
  updates: Partial<Omit<WhatsAppConsent, "userId" | "lastUpdated">>,
): Promise<WhatsAppConsent> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const { data: existing } = await supabase
    .from("whatsapp_consent")
    .select("*")
    .eq("user_id", userId)
    .single();

  const consentData = {
    user_id: userId,
    enabled: updates.enabled ?? existing?.enabled ?? true,
    channels: updates.channels ?? existing?.channels ?? ["whatsapp"],
    quiet_hours_start: updates.quietHoursStart ?? existing?.quiet_hours_start,
    quiet_hours_end: updates.quietHoursEnd ?? existing?.quiet_hours_end,
    allow_followups: updates.allowFollowups ?? existing?.allow_followups ?? true,
    allow_briefings: updates.allowBriefings ?? existing?.allow_briefings ?? true,
    allow_urgent_alerts: updates.allowUrgentAlerts ?? existing?.allow_urgent_alerts ?? true,
  };

  const { data } = await supabase
    .from("whatsapp_consent")
    .upsert(consentData, { onConflict: "user_id" })
    .select()
    .single();

  return {
    userId: data.user_id,
    enabled: data.enabled,
    channels: data.channels || ["whatsapp"],
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    allowFollowups: data.allow_followups,
    allowBriefings: data.allow_briefings,
    allowUrgentAlerts: data.allow_urgent_alerts,
    lastUpdated: data.updated_at,
  };
}

export async function revokeConsent(userId: string): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  await supabase.from("whatsapp_consent").upsert(
    {
      user_id: userId,
      enabled: false,
    },
    { onConflict: "user_id" },
  );
}

export async function isQuietHours(userId: string): Promise<boolean> {
  const consent = await getConsent(userId);
  if (!consent?.quietHoursStart || !consent?.quietHoursEnd) return false;

  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const currentHours = jakartaTime.getHours();
  const currentMinutes = jakartaTime.getMinutes();
  const currentTime = currentHours * 60 + currentMinutes;

  const [startH, startM] = consent.quietHoursStart.split(":").map(Number);
  const [endH, endM] = consent.quietHoursEnd.split(":").map(Number);
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    return currentTime >= startTime || currentTime <= endTime;
  }
}

export function canSendNotification(
  consent: WhatsAppConsent | null,
  notificationType: "followup" | "briefing" | "urgent" | "reminder",
  isQuietHours: boolean,
): boolean {
  if (!consent?.enabled) return false;
  if (isQuietHours && notificationType !== "urgent") return false;

  switch (notificationType) {
    case "followup":
      return consent.allowFollowups;
    case "briefing":
      return consent.allowBriefings;
    case "urgent":
      return consent.allowUrgentAlerts;
    case "reminder":
      return true;
    default:
      return true;
  }
}
