/// <reference lib="webworker" />

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
