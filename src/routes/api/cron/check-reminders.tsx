import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/cron/check-reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );
          if (!await isAuthorized(request, supabase)) {
            return json({ error: "Unauthorized" }, 401);
          }
          const now = new Date();
          const dryRun = new URL(request.url).searchParams.get("dry_run") === "1";

          const [
            { data: tasks, error: taskError },
            { data: waitingItems, error: waitingError },
            { data: settingsRows, error: settingsError },
            { data: briefingTasks, error: briefingTaskError },
            { data: briefingWaiting, error: briefingWaitingError },
            { data: briefingInbox, error: briefingInboxError },
          ] = await Promise.all([
            supabase
              .from("tasks")
              .select("id,user_id,title,due_date,time,reminder_time,reminder_channels,reminder_intensity,last_reminded_at,reminder_count,semantic_context")
              .eq("status", "pending")
              .eq("reminder_enabled", true),
            supabase
              .from("waiting_items")
              .select("id,user_id,title,person_name,follow_up_at,follow_up_count")
              .eq("status", "waiting")
              .eq("auto_follow_up_enabled", true)
              .not("follow_up_at", "is", null)
              .lte("follow_up_at", now.toISOString()),
            supabase.from("user_settings").select("user_id,settings"),
            supabase
              .from("tasks")
              .select("id,user_id,title,due_date,priority")
              .eq("status", "pending"),
            supabase
              .from("waiting_items")
              .select("id,user_id,title,follow_up_at,status")
              .in("status", ["waiting", "snoozed"]),
            supabase
              .from("inbox_items")
              .select("id,user_id,title")
              .eq("status", "pending"),
          ]);

          if (taskError) throw taskError;
          if (waitingError) throw waitingError;
          if (settingsError) throw settingsError;
          if (briefingTaskError) throw briefingTaskError;
          if (briefingWaitingError) throw briefingWaitingError;
          if (briefingInboxError) throw briefingInboxError;

          if (dryRun) {
            return json({
              ok: true,
              dryRun: true,
              taskCandidates: tasks?.length || 0,
              waitingCandidates: waitingItems?.length || 0,
              briefingWindows: (settingsRows || []).filter((row) =>
                isBriefingWindow((row.settings || {}) as Record<string, unknown>, now),
              ).length,
              timestamp: now.toISOString(),
            });
          }

          const settingsByUser = new Map(
            (settingsRows || []).map((row) => [row.user_id, (row.settings || {}) as Record<string, unknown>]),
          );

          let processed = 0;
          let attempted = 0;
          let briefingsSent = 0;

          const today = jakartaDate(now);
          for (const row of settingsRows || []) {
            const settings = (row.settings || {}) as Record<string, unknown>;
            const notificationPrefs =
              settings.notifications && typeof settings.notifications === "object"
                ? (settings.notifications as Record<string, unknown>)
                : {};
            if (notificationPrefs["Briefing harian"] === false) continue;
            if (!isBriefingWindow(settings, now) || isQuietHours(settings, now)) continue;

            const userTasks = (briefingTasks || []).filter((task) => task.user_id === row.user_id);
            const userWaiting = (briefingWaiting || []).filter(
              (item) => item.user_id === row.user_id,
            );
            const userInbox = (briefingInbox || []).filter((item) => item.user_id === row.user_id);
            const overdue = userTasks.filter(
              (task) => task.due_date && String(task.due_date).slice(0, 10) < today,
            );
            const dueToday = userTasks.filter(
              (task) => task.due_date && String(task.due_date).slice(0, 10) === today,
            );
            const waitingDue = userWaiting.filter(
              (item) => item.follow_up_at && new Date(item.follow_up_at).getTime() <= now.getTime(),
            );
            const ordered = [...userTasks].sort((a, b) => {
              const aDay = a.due_date ? String(a.due_date).slice(0, 10) : "9999-12-31";
              const bDay = b.due_date ? String(b.due_date).slice(0, 10) : "9999-12-31";
              if (aDay !== bDay) return aDay.localeCompare(bDay);
              const rank = (priority: string | null) =>
                priority === "urgent" ? 4 : priority === "high" ? 3 : priority === "medium" ? 2 : 1;
              return rank(b.priority) - rank(a.priority);
            });
            const first = ordered[0]?.title;
            const bodyParts = [
              dueToday.length ? `${dueToday.length} due today` : "",
              overdue.length ? `${overdue.length} overdue` : "",
              waitingDue.length ? `${waitingDue.length} follow-up` : "",
              userInbox.length ? `${userInbox.length} clarify` : "",
            ].filter(Boolean);
            const body = bodyParts.length
              ? `Today: ${bodyParts.join(" · ")}.${first ? ` Start with “${first}”.` : ""}`
              : "Nothing urgent is pressing this morning. Choose one meaningful thing to move forward.";

            const channels = Array.isArray(settings.reminderChannels)
              ? settings.reminderChannels
              : ["in_app", "push"];
            let sent = 0;
            if (channels.includes("in_app")) {
              attempted++;
              sent += await sendInAppNotification(supabase, row.user_id, {
                itemId: null,
                type: "briefing",
                title: "Your NANTI briefing",
                body,
                dedupeKey: `briefing:${today}`,
              });
            }
            if (channels.includes("push")) {
              attempted++;
              sent += await sendPushNotification(supabase, row.user_id, {
                title: "Your NANTI briefing",
                body,
                tag: `nanti-briefing-${today}`,
                data: { url: "/app/today" },
              });
            }
            if (channels.includes("whatsapp")) {
              attempted++;
              sent += await sendWhatsAppNotification(supabase, row.user_id, body);
            }
            if (sent > 0) {
              briefingsSent++;
              processed++;
            }
          }

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

            const dueDay = task.due_date ? String(task.due_date).slice(0, 10) : "";
            const today = jakartaDate(now);
            const overdue = Boolean(dueDay && dueDay < today);
            const title = overdue ? "Tugas terlambat" : "Pengingat NANTI";
            const semantic =
              task.semantic_context && typeof task.semantic_context === "object"
                ? (task.semantic_context as Record<string, any>)
                : {};
            const reminderBody =
              (typeof semantic?.reminder?.message === "string" && semantic.reminder.message.trim()) ||
              [
                task.title,
                typeof semantic.where === "string" && semantic.where
                  ? `di ${semantic.where}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ");
            let sent = 0;

            if (channels.includes("in_app")) {
              attempted++;
              const windowHours = Math.max(1, minHours);
              const bucket = Math.floor(now.getTime() / (windowHours * 3_600_000));
              sent += await sendInAppNotification(supabase, task.user_id, {
                itemId: task.id,
                type: overdue ? "task_overdue" : "task_due",
                title,
                body: reminderBody,
                dedupeKey: `task:${task.id}:${bucket}`,
              });
            }
            if (channels.includes("push")) {
              attempted++;
              sent += await sendPushNotification(supabase, task.user_id, {
                title,
                body: reminderBody,
                tag: `nanti-task-${task.id}`,
                data: { itemId: task.id, url: "/app/today" },
              });
            }
            if (channels.includes("whatsapp")) {
              attempted++;
              sent += await sendWhatsAppNotification(
                supabase,
                task.user_id,
                `${title}: ${reminderBody}`,
              );
            }

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

          for (const waiting of waitingItems || []) {
            const settings = settingsByUser.get(waiting.user_id) || {};
            if (isQuietHours(settings, now)) continue;
            const channels = Array.isArray(settings.reminderChannels)
              ? settings.reminderChannels
              : ["push", "in_app"];
            const who = waiting.person_name ? ` dari ${waiting.person_name}` : "";
            const body = `Masih menunggu “${waiting.title}”${who}. Sudah waktunya follow up.`;
            let sent = 0;

            if (channels.includes("in_app")) {
              attempted++;
              const dayBucket = jakartaDate(now);
              sent += await sendInAppNotification(supabase, waiting.user_id, {
                itemId: waiting.id,
                type: "waiting_followup",
                title: "Waktunya follow up",
                body,
                dedupeKey: `waiting:${waiting.id}:${dayBucket}`,
              });
            }
            if (channels.includes("push")) {
              attempted++;
              sent += await sendPushNotification(supabase, waiting.user_id, {
                title: "Waktunya follow up",
                body,
                tag: `nanti-waiting-${waiting.id}`,
                data: { itemId: waiting.id, url: "/app/waiting" },
              });
            }
            if (channels.includes("whatsapp")) {
              attempted++;
              sent += await sendWhatsAppNotification(supabase, waiting.user_id, body);
            }

            if (sent > 0) {
              await supabase
                .from("waiting_items")
                .update({
                  follow_up_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: now.toISOString(),
                })
                .eq("id", waiting.id)
                .eq("user_id", waiting.user_id);
              processed++;
            }
          }

          return json({
            processed,
            attempted,
            taskCandidates: tasks?.length || 0,
            waitingCandidates: waitingItems?.length || 0,
            briefingsSent,
            timestamp: now.toISOString(),
          });
        } catch (error) {
          console.error("Reminder check error:", error);
          return json({ error: "Internal error" }, 500);
        }
      },
    },
  },
});

async function isAuthorized(
  request: Request,
  supabase: ReturnType<typeof createClient>,
) {
  const header = request.headers.get("Authorization") || "";
  const envSecret = process.env.CRON_SECRET;
  if (envSecret && header === `Bearer ${envSecret}`) return true;

  const { data, error } = await supabase
    .from("automation_runtime")
    .select("secret")
    .eq("key", "reminder_dispatch")
    .maybeSingle();
  if (error) {
    console.error("Could not read scheduler credential:", error);
    return false;
  }
  return Boolean(data?.secret && header === `Bearer ${data.secret}`);
}

async function sendInAppNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  notification: {
    itemId?: string | null;
    type: "task_due" | "task_overdue" | "waiting_followup" | "briefing";
    title: string;
    body: string;
    dedupeKey: string;
  },
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      item_id: notification.itemId ?? null,
      notification_type: notification.type,
      title: notification.title,
      body: notification.body,
      dedupe_key: notification.dedupeKey,
      status: "unread",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code === "23505") return 0;
    throw error;
  }
  return data ? 1 : 0;
}

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

function isBriefingWindow(settings: Record<string, unknown>, now: Date) {
  const value = typeof settings.briefingTime === "string" ? settings.briefingTime : "08:00";
  const [h, m] = value.split(":").map(Number);
  const target = (h || 0) * 60 + (m || 0);
  const current = jakartaMinutes(now);
  const delta = current - target;
  return delta >= 0 && delta < 10;
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
  task: { due_date?: string | null; time?: string | null; reminder_time?: string | null },
  now: Date,
) {
  if (task.reminder_time) return new Date(task.reminder_time).getTime() <= now.getTime();

  if (!task.due_date) return false;
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

  const publicKey =
    process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  if (!publicKey || !privateKey) return 0;

  const webpush = await import("web-push");
  webpush.setVapidDetails(
    "mailto:noreply@nanti-app.com",
    publicKey,
    privateKey,
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


async function sendWhatsAppNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: string,
) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v26.0";
  if (!phoneNumberId || !accessToken) return 0;

  const { data: link, error } = await supabase
    .from("whatsapp_user_links")
    .select("phone_number")
    .eq("user_id", userId)
    .not("verified_at", "is", null)
    .maybeSingle();
  if (error) throw error;
  if (!link?.phone_number) return 0;

  const { data: lastInbound, error: inboundError } = await supabase
    .from("whatsapp_messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (inboundError) throw inboundError;

  const withinServiceWindow =
    Boolean(lastInbound?.created_at) &&
    Date.now() - new Date(lastInbound!.created_at).getTime() < 23.5 * 60 * 60 * 1000;
  const templateName = process.env.WHATSAPP_REMINDER_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_REMINDER_TEMPLATE_LANGUAGE || "id";

  let messageBody: Record<string, unknown>;
  if (withinServiceWindow) {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: String(link.phone_number).replace(/\D/g, ""),
      type: "text",
      text: { body: body.slice(0, 4096), preview_url: false },
    };
  } else if (templateName) {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: String(link.phone_number).replace(/\D/g, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: body.slice(0, 1024) }],
          },
        ],
      },
    };
  } else {
    // Keep in-app/push reminders reliable even before a WhatsApp utility template is approved.
    return 0;
  }

  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(messageBody),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("WhatsApp reminder failed", response.status, detail.slice(0, 300));
    return 0;
  }
  return 1;
}
