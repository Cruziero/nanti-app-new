import { createClient } from "@supabase/supabase-js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

export async function subscribeToPushNotifications(userId: string, subscription: PushSubscription) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const subscriptionData = subscription.toJSON();
  const p256dh = subscriptionData.keys?.p256dh || "";
  const auth = subscriptionData.keys?.auth || "";

  await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    user_agent: "web",
  });
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const webpush = await import("web-push");

  webpush.setVapidDetails("mailto:noreply@nanti-app.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({
    title,
    body,
    tag: data?.tag || "nanti-notification",
    requireInteraction: data?.requireInteraction || false,
    data: {
      url: data?.url || "/app",
      itemId: data?.itemId,
      ...data,
    },
    actions: data?.actions || [
      { action: "open", title: "Buka" },
      { action: "snooze", title: "Tunda" },
      { action: "done", title: "Selesai" },
    ],
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        );
      } catch (error: unknown) {
        const err = error as { statusCode?: number };
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        throw error;
      }
    }),
  );

  return results;
}

export async function sendBatchNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }>,
) {
  const results = await Promise.allSettled(
    notifications.map((n) => sendPushNotification(n.userId, n.title, n.body, n.data)),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return { succeeded, failed };
}
