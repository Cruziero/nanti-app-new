import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import type { ConversationTone, ReminderChannel } from "@/lib/nanti-types";
import { cn } from "@/lib/utils";
import { Check, Bell, BellOff, Loader2, MessageCircle, Copy } from "lucide-react";
import {
  disconnectWhatsApp,
  fetchWhatsAppLink,
  startWhatsAppLink,
} from "@/lib/nanti-supabase";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings - NANTI" },
      { name: "description", content: "Configure NANTI to your workday." },
    ],
  }),
  component: SettingsPage,
});

const toneOptions: { id: ConversationTone; label: string }[] = [
  { id: "formal", label: "Formal" },
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "friendly", label: "Friendly" },
  { id: "warm", label: "Warm" },
  { id: "loving", label: "Loving" },
  { id: "direct", label: "Direct" },
];

const channelOpts: { id: ReminderChannel; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "push", label: "Push Notifications" },
  { id: "calendar", label: "Google Calendar" },
  { id: "in_app", label: "In-app" },
];

type WhatsAppLinkState = {
  phone_number?: string | null;
  link_code?: string | null;
  link_expires_at?: string | null;
  verified_at?: string | null;
};

function SettingsPage() {
  const { settings, setSettings, reset } = useNanti();
  const [whatsAppLink, setWhatsAppLink] = useState<WhatsAppLinkState | null>(null);
  const [whatsAppLoading, setWhatsAppLoading] = useState(true);
  const nantiWhatsAppNumber = String(import.meta.env.VITE_NANTI_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const whatsappConnected = Boolean(whatsAppLink?.verified_at && whatsAppLink?.phone_number);
  const { signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const {
    isSubscribed,
    permission,
    loading: pushLoading,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  const refreshWhatsApp = useCallback(async () => {
    try {
      const link = await fetchWhatsAppLink();
      setWhatsAppLink(link as WhatsAppLinkState | null);
    } catch (error) {
      console.error("Failed to load WhatsApp connection:", error);
    } finally {
      setWhatsAppLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWhatsApp();
  }, [refreshWhatsApp]);

  useEffect(() => {
    if (!whatsAppLink?.link_code || whatsappConnected) return;
    const timer = window.setInterval(() => {
      void refreshWhatsApp();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refreshWhatsApp, whatsAppLink?.link_code, whatsappConnected]);

  useEffect(() => {
    if (whatsAppLoading || settings.whatsappConnected === whatsappConnected) return;
    void setSettings({ whatsappConnected });
  }, [whatsAppLoading, whatsappConnected, settings.whatsappConnected, setSettings]);

  const connectWhatsApp = async () => {
    setWhatsAppLoading(true);
    try {
      const result = await startWhatsAppLink();
      if (result.connected) {
        await refreshWhatsApp();
        toast.success("WhatsApp already connected");
        return;
      }
      setWhatsAppLink({
        phone_number: null,
        verified_at: null,
        link_code: result.code,
        link_expires_at: result.expires_at,
      });
    } catch (error) {
      console.error("Failed to start WhatsApp link:", error);
      toast.error("Could not start WhatsApp connection.");
    } finally {
      setWhatsAppLoading(false);
    }
  };

  const unlinkWhatsApp = async () => {
    setWhatsAppLoading(true);
    try {
      await disconnectWhatsApp();
      setWhatsAppLink(null);
      const nextChannels = settings.reminderChannels.filter((channel) => channel !== "whatsapp");
      await setSettings({ reminderChannels: nextChannels, whatsappConnected: false });
      toast.success("WhatsApp disconnected");
    } catch (error) {
      console.error("Failed to disconnect WhatsApp:", error);
      toast.error("Could not disconnect WhatsApp.");
    } finally {
      setWhatsAppLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out.");
    navigate({ to: "/auth/login" });
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" subtitle="Configure NANTI to your workday" />

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <Label className="text-[13px]">What should NANTI call you?</Label>
            <Input
              className="mt-1.5"
              value={settings.preferredName || settings.name}
              onChange={(e) => setSettings({ preferredName: e.target.value, name: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          AI Personality
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {toneOptions.map((t) => (
            <button
              key={t.id}
              onClick={() => setSettings({ tone: t.id })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                settings.tone === t.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/30",
              )}
            >
              {settings.tone === t.id && <Check className="mr-1 inline size-3" />}
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Reminder Channels
        </h2>
        <div className="divide-y divide-border">
          {channelOpts.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between py-3">
              <span className="text-[13.5px]">{ch.label}</span>
              <Switch
                checked={settings.reminderChannels.includes(ch.id)}
                disabled={ch.id === "whatsapp" && !whatsappConnected}
                onCheckedChange={() => {
                  if (ch.id === "whatsapp" && !whatsappConnected) {
                    toast("Connect WhatsApp first.");
                    return;
                  }
                  const current = settings.reminderChannels;
                  const next = current.includes(ch.id)
                    ? current.filter((c) => c !== ch.id)
                    : [...current, ch.id];
                  void setSettings({ reminderChannels: next });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Quiet Hours
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13.5px]">Do not disturb</p>
            <p className="text-[12px] text-muted-foreground">
              No non-urgent reminders during quiet hours
            </p>
          </div>
          <Switch
            checked={settings.quietHoursEnabled}
            onCheckedChange={(c) => setSettings({ quietHoursEnabled: c })}
          />
        </div>
        {settings.quietHoursEnabled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[12px]">Start</Label>
              <Input
                type="time"
                className="mt-1"
                value={settings.quietHoursStart}
                onChange={(e) => setSettings({ quietHoursStart: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-[12px]">End</Label>
              <Input
                type="time"
                className="mt-1"
                value={settings.quietHoursEnd}
                onChange={(e) => setSettings({ quietHoursEnd: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Integrations
        </h2>
        <div className="divide-y divide-border">
          <div className="py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="size-4 text-primary" />
                <div>
                  <p className="text-[13.5px]">WhatsApp</p>
                  <p className="text-[12px] text-muted-foreground">
                    {whatsappConnected
                      ? `Connected to ${whatsAppLink?.phone_number}`
                      : "Forward messages to NANTI and turn them into actions"}
                  </p>
                </div>
              </div>
              {whatsAppLoading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : whatsappConnected ? (
                <Button variant="outline" size="sm" onClick={() => void unlinkWhatsApp()}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={() => void connectWhatsApp()}>
                  Connect
                </Button>
              )}
            </div>

            {!whatsappConnected && whatsAppLink?.link_code && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-medium text-foreground">
                  Send this message to NANTI on WhatsApp within 15 minutes:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="rounded bg-background px-2 py-1.5 text-sm font-semibold">
                    LINK {whatsAppLink.link_code}
                  </code>
                  <button
                    type="button"
                    aria-label="Copy WhatsApp link code"
                    onClick={() => {
                      void navigator.clipboard.writeText(`LINK ${whatsAppLink.link_code}`);
                      toast.success("Link code copied");
                    }}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-background"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
                {nantiWhatsAppNumber ? (
                  <a
                    className="mt-3 inline-flex min-h-10 items-center rounded-md bg-[#25D366] px-3 text-xs font-semibold text-black"
                    href={`https://wa.me/${nantiWhatsAppNumber}?text=${encodeURIComponent(`LINK ${whatsAppLink.link_code}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open WhatsApp
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    The NANTI WhatsApp number still needs to be configured on the deployment.
                  </p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  This page checks automatically after you send the code.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-[13.5px]">Google Calendar</p>
              <p className="text-[12px] text-muted-foreground">Sync your schedule</p>
            </div>
            {settings.calendarConnected ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                Connected
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = `/api/auth/google?state=${settings.preferredName || "user"}`;
                }}
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="size-4 text-primary" />
            ) : (
              <BellOff className="size-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-[13.5px]">Push Notifications</p>
              <p className="text-[12px] text-muted-foreground">
                {permission === "granted"
                  ? "Active"
                  : permission === "denied"
                    ? "Blocked"
                    : "Not enabled"}
              </p>
            </div>
          </div>
          {permission === "denied" ? (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive">
              Blocked
            </span>
          ) : (
            <Button
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
              disabled={pushLoading}
              onClick={isSubscribed ? unsubscribe : subscribe}
            >
              {pushLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : isSubscribed ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </Button>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Privacy & Data
        </h2>
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              toast.success("Demo data restored");
            }}
          >
            Restore demo data
          </Button>
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <Button variant="destructive" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
