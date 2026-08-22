import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/cron/check-reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );

          const now = new Date();
          const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
          const currentHour = jakartaTime.getHours();
          const currentMinutes = jakartaTime.getMinutes();

          const { data: users } = await supabase
            .from("user_preferences")
            .select("user_id, quiet_hours_start, quiet_hours_end, reminder_channels");

          if (!users) return new Response(JSON.stringify({ processed: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });

          let processed = 0;

          for (const user of users) {
            const isQuietHours = checkQuietHours(
              user.quiet_hours_start,
              user.quiet_hours_end,
              currentHour,
              currentMinutes,
            );

            if (isQuietHours) continue;

            const { data: tasks } = await supabase
              .from("tasks")
              .select("*")
              .eq("user_id", user.user_id)
              .eq("status", "pending")
              .eq("reminder_enabled", true)
              .lte("due_date", now.toISOString().slice(0, 10));

            if (!tasks) continue;

            for (const task of tasks) {
              const dueDate = new Date(task.due_date);
              const diffDays = Math.floor(
                (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
              );

              const shouldRemind =
                diffDays >= 0 ||
                (diffDays === -1 && task.reminder_intensity === "persistent") ||
                (diffDays === 0 && task.reminder_intensity !== "gentle");

              if (!shouldRemind) continue;

              const lastReminded = task.last_reminded_at ? new Date(task.last_reminded_at) : null;
              const hoursSinceLastRemind = lastReminded
                ? (now.getTime() - lastReminded.getTime()) / (1000 * 60 * 60)
                : Infinity;

              const minInterval = task.reminder_intensity === "persistent" ? 2 : 6;
              if (hoursSinceLastRemind < minInterval) continue;

              const channels = user.reminder_channels || ["push"];

              for (const channel of channels) {
                if (channel === "push") {
                  await sendPushNotification(supabase, user.user_id, {
                    title: diffDays > 0 ? "Tugas terlambat!" : "Pengingat tugas",
                    body: `${task.title}${diffDays > 0 ? ` (${diffDays} hari terlambat)` : ""}`,
                    tag: `reminder-${task.id}`,
                    data: { itemId: task.id, url: `/app` },
                  });
                }

                if (channel === "whatsapp") {
                  await supabase.from("whatsapp_outbound_queue").insert({
                    user_id: user.user_id,
                    phone_number: task.user_phone,
                    message_type: "reminder",
                    content: `NANTI: ${task.title}${diffDays > 0 ? ` sudah terlambat ${diffDays} hari` : " jatuh tempo hari ini"}`,
                    item_id: task.id,
                  });
                }
              }

              await supabase
                .from("tasks")
                .update({
                  last_reminded_at: now.toISOString(),
                  reminder_count: (task.reminder_count || 0) + 1,
                })
                .eq("id", task.id);

              processed++;
            }
          }

          return new Response(JSON.stringify({ processed, timestamp: now.toISOString() }), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (error) {
          console.error("Reminder check error:", error);
          return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});

function checkQuietHours(
  start: string | null,
  end: string | null,
  currentHour: number,
  currentMinutes: number,
): boolean {
  if (!start || !end) return false;

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const currentTime = currentHour * 60 + currentMinutes;
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    return currentTime >= startTime || currentTime <= endTime;
  }
}

async function sendPushNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: { title: string; body: string; tag: string; data: Record<string, unknown> },
) {
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  try {
    const webpush = await import("web-push");
    webpush.setVapidDetails(
      "mailto:noreply@nanti-app.com",
      process.env.VAPID_PUBLIC_KEY || "",
      process.env.VAPID_PRIVATE_KEY || "",
    );

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            ...payload,
            actions: [
              { action: "open", title: "Buka" },
              { action: "snooze", title: "Tunda 1 jam" },
              { action: "done", title: "Selesai" },
            ],
          }),
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }
  } catch {
    console.error("web-push not available");
  }
}
