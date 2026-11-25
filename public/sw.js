/// <reference lib="webworker" />

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Keep these in sync with src/lib/nanti-share.ts.
const SHARE_PATH = "/api/share-target";
const SHARE_CACHE = "nanti-share";
const SHARE_FILE_KEY = "/__share/file";
const SHARE_TEXT_KEY = "/__share/text";

async function stashShare(request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((entry) => entry instanceof File);
    const file =
      files.find((f) => f.type === "text/plain" || f.name.toLowerCase().endsWith(".txt")) ||
      files.find((f) => f.type.startsWith("image/"));
    const text = [form.get("text"), form.get("url")]
      .filter((value) => typeof value === "string" && value.trim())
      .join("\n");

    const cache = await caches.open(SHARE_CACHE);
    await Promise.all([cache.delete(SHARE_FILE_KEY), cache.delete(SHARE_TEXT_KEY)]);
    if (file) {
      await cache.put(
        SHARE_FILE_KEY,
        new Response(file, {
          headers: {
            "Content-Type": file.type || "text/plain",
            "X-File-Name": encodeURIComponent(file.name || "shared.txt"),
          },
        }),
      );
    } else if (text) {
      await cache.put(
        SHARE_TEXT_KEY,
        new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } }),
      );
    }
  } catch (error) {
    console.error("Share capture failed:", error);
  }
  return Response.redirect("/app/import", 303);
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "POST") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname !== SHARE_PATH) return;
  event.respondWith(stashShare(event.request));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "NANTI", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "NANTI", {
      body: data.body || "Anda memiliki pengingat baru",
      tag: data.tag || "nanti-reminder",
      data: data.data || { url: "/app/today" },
      requireInteraction: Boolean(data.requireInteraction),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const target = data.url || "/app/today";
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          if ("navigate" in client) client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
