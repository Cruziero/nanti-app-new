import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/push/config")
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => {
        if (cancelled || !config) return;
        setConfigured(Boolean(config.configured && config.publicKey));
        setVapidPublicKey(typeof config.publicKey === "string" ? config.publicKey : "");
      })
      .catch((error) => console.error("Push config load failed:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (cancelled) return;
        setSubscription(sub);
        setPermission(Notification.permission);
      })
      .catch((error) => console.error("Service worker setup failed:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    if (!configured || !vapidPublicKey) {
      toast.error("Push notifications are not configured on this deployment.");
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        toast.error("Izin notifikasi ditolak");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(sub);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No authenticated session");

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!response.ok) throw new Error("Push subscription was not saved");

      toast.success("Notifikasi push aktif");
    } catch (err) {
      console.error("Push subscribe error:", err);
      toast.error("Gagal mengaktifkan notifikasi");
    } finally {
      setLoading(false);
    }
  }, [configured, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      if (subscription) {
        await subscription.unsubscribe();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("No authenticated session");
        const response = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error("Push subscription was not removed");
      }
      setSubscription(null);
      toast.success("Notifikasi push dinonaktifkan");
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  return {
    subscription,
    permission,
    loading,
    isSubscribed: !!subscription,
    configured,
    subscribe,
    unsubscribe,
  };
}
