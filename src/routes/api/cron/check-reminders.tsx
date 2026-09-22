import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/cron/check-reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
          return json({ error: "Unauthorized" }, 401);
        }

        try {
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );
          const now = new Date();

          const [{ data: tasks, error: taskError }, { data: settingsRows, error: settingsError }] =
            await Promise.all([
              supabase
                .from("tasks")
                .select("id,user_id,title,due_date,time,reminder_time,reminder_channels,reminder_intensity,last_reminded_at,reminder_count")
                .eq("status", "pending")
                .eq("reminder_enabled", true)
                .not("due_date", "is", null)
                .lte("due_date", now.toISOString()),
              supabase.from("user_settings").select("user_id,settings"),
            ]);

          if (taskError) throw taskError;
          if (settingsError) throw settingsError;

          const settingsByUser = new Map(
            (settingsRows || []).map((row) => [row.user_id, (row.settings || {}) as Record<string, unknown>]),
          );

          let processed = 0;
          let attempted = 0;

          for (const task of tasks || []) {
            const settings = settingsByUser.get(task.user_id) || {};
            if (isQuietHours(settings, now)) continue;
            if (!isReminderDue(task, now)) continue;

            const intensity = task.reminder_intensity || "normal";
            const minHours = intensity === "persistent" ? 2 : intensity === "gentle" ? 24 : 8;
            if (task.last_reminded_at) {
              const elapsed = (now.getTime() - new Date(task.last_reminded_at).getTime()) / 3_600_000;
              if (elapsed < minHours) continue;
            }

            const channels =
              Array.isArray(task.reminder_channels) && task.reminder_channels.length
                ? task.reminder_channels
                : Array.isArray(settings.reminderChannels)
                  ? settings.reminderChannels
                  : ["push", "in_app"];

            if (!channels.includes("push")) continue;
            attempted++;

            const dueDay = String(task.due_date).slice(0, 10);
            const today = jakartaDate(now);
            const overdue = dueDay < today;
            const sent = await sendPushNotification(supabase, task.user_id, {
              title: overdue ? "Tugas terlambat" : "Pengingat NANTI",
              body: task.title,
              tag: `nanti-task-${task.id}`,
              data: { itemId: task.id, url: "/app/today" },
            });

            if (sent > 0) {
              await supabase
                .from("tasks")
                .update({
                  last_reminded_at: now.toISOString(),
                  reminder_count: (task.reminder_count || 0) + 1,
                })
                .eq("id", task.id)
                .eq("user_id", task.user_id);
              processed++;
            }
          }

          return json({ processed, attempted, timestamp: now.toISOString() });
        } catch (error) {
          console.error("Reminder check error:", error);
          return json({ error: "Internal error" }, 500);
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

function jakartaDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function jakartaMinutes(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(value.hour) * 60 + Number(value.minute);
}

function isQuietHours(settings: Record<string, unknown>, now: Date) {
  if (settings.quietHoursEnabled === false) return false;
  const start = typeof settings.quietHoursStart === "string" ? settings.quietHoursStart : "22:00";
  const end = typeof settings.quietHoursEnd === "string" ? settings.quietHoursEnd : "07:00";
  const toMinutes = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const current = jakartaMinutes(now);
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  return startMinutes <= endMinutes
    ? current >= startMinutes && current < endMinutes
    : current >= startMinutes || current < endMinutes;
}

function isReminderDue(
  task: { due_date: string; time?: string | null; reminder_time?: string | null },
  now: Date,
) {
  if (task.reminder_time) return new Date(task.reminder_time).getTime() <= now.getTime();

  const dueDay = String(task.due_date).slice(0, 10);
  const today = jakartaDate(now);
  if (dueDay < today) return true;
  if (dueDay > today) return false;

  if (task.time) {
    const dueAt = new Date(`${dueDay}T${task.time}:00+07:00`);
    const remindAt = new Date(dueAt.getTime() - 60 * 60 * 1000);
    return now.getTime() >= remindAt.getTime();
  }

  return jakartaMinutes(now) >= 9 * 60;
}

async function sendPushNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: { title: string; body: string; tag: string; data: Record<string, unknown> },
) {
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("user_id", userId);
  if (error) throw error;
  if (!subscriptions?.length) return 0;

  const webpush = await import("web-push");
  webpush.setVapidDetails(
    "mailto:noreply@nanti-app.com",
    process.env.VAPID_PUBLIC_KEY || "",
    process.env.VAPID_PRIVATE_KEY || "",
  );

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      } else {
        console.error("Push delivery failed:", err);
      }
    }
  }
  return sent;
}
