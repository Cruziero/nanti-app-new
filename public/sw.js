/// <reference lib="webworker" />

const CACHE_NAME = "nanti-v1";
const STATIC_ASSETS = ["/", "/app", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "NANTI",
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || "Anda memiliki pengingat baru",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: data.tag || "nanti-reminder",
    data: data.data || {},
    actions: data.actions || [
      { action: "open", title: "Buka" },
      { action: "snooze", title: "Tunda" },
      { action: "done", title: "Selesai" },
    ],
    requireInteraction: data.requireInteraction || false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "NANTI", options));
});

self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  const data = event.notification.data;

  event.notification.close();

  if (action === "snooze" && data.itemId) {
    event.waitUntil(
      fetch("/api/reminders/snooze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: data.itemId, minutes: 60 }),
      }),
    );
    return;
  }

  if (action === "done" && data.itemId) {
    event.waitUntil(
      fetch("/api/reminders/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: data.itemId }),
      }),
    );
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const url = data.url || "/app";
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(fetchEvent.request).then((cached) => {
      return cached || fetch(fetchEvent.request);
    }),
  );
});
