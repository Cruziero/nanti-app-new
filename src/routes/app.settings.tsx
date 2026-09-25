import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Check,
  Bell,
  BellOff,
  Loader2,
  MessageCircle,
  Copy,
  Brain,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import {
  disconnectWhatsApp,
  fetchWhatsAppLink,
  startWhatsAppLink,
} from "@/lib/nanti-supabase";
import {
  deleteLanguageMemory,
  fetchLanguageMemories,
  setLanguageMemoryActive,
  type LanguageMemoryRow,
} from "@/lib/nanti-learning.functions";
import {
  deleteEntityAlias,
  deleteUserRoutine,
  fetchEntityAliases,
  fetchUserRoutines,
  setEntityAliasActive,
  setUserRoutineActive,
  type EntityAliasRow,
  type UserRoutineRow,
} from "@/lib/nanti-context-memory.functions";
import {
  fetchAssistantQuality,
  runAssistantSmokeCheck,
  type AssistantEvalRun,
} from "@/lib/nanti-quality.functions";
import {
  disconnectGoogleCalendar,
  fetchGoogleCalendarStatus,
  startGoogleCalendarConnect,
  syncGoogleCalendarNow,
} from "@/lib/nanti-calendar.functions";
import {
  deleteMyNantiAccount,
  exportMyNantiData,
} from "@/lib/nanti-account.functions";

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

const PUSH_LAUNCH_ENABLED = false;
const CALENDAR_LAUNCH_ENABLED = false;
const WHATSAPP_LAUNCH_ENABLED = false;

const channelOpts: { id: ReminderChannel; label: string }[] = [
  ...(PUSH_LAUNCH_ENABLED
    ? [{ id: "push" as ReminderChannel, label: "Push Notifications" }]
    : []),
  { id: "in_app", label: "In-app" },
];

type WhatsAppLinkState = {
  phone_number?: string | null;
  link_code?: string | null;
  link_expires_at?: string | null;
  verified_at?: string | null;
};

function SettingsPage() {
  const { settings, setSettings } = useNanti();
  const [whatsAppLink, setWhatsAppLink] = useState<WhatsAppLinkState | null>(null);
  const [whatsAppLoading, setWhatsAppLoading] = useState(true);
  const [languageMemories, setLanguageMemories] = useState<LanguageMemoryRow[]>([]);
  const [entityAliases, setEntityAliases] = useState<EntityAliasRow[]>([]);
  const [routines, setRoutines] = useState<UserRoutineRow[]>([]);
  const [languageLoading, setLanguageLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(true);
  const [qualityRuns, setQualityRuns] = useState<AssistantEvalRun[]>([]);
  const [qualityLoading, setQualityLoading] = useState(true);
  const [qualityRunning, setQualityRunning] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    status: "connected" | "failed" | "disconnected";
    last_synced_at?: string | null;
    connected_at?: string | null;
    next_event?: {
      title: string;
      start_date: string;
      end_date?: string | null;
      location?: string | null;
    } | null;
  } | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarAction, setCalendarAction] = useState<"connect" | "sync" | "disconnect" | null>(null);
  const [accountExporting, setAccountExporting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [pushTesting, setPushTesting] = useState(false);
  const nantiWhatsAppNumber = String(import.meta.env.VITE_NANTI_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const whatsappConnected = Boolean(whatsAppLink?.verified_at && whatsAppLink?.phone_number);
  const { user, signOut } = useSupabaseAuth();
  const isAdmin = user?.app_metadata?.role === "admin";
  const navigate = useNavigate();
  const {
    isSubscribed,
    permission,
    loading: pushLoading,
    configured: pushConfigured,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  const refreshWhatsApp = useCallback(async () => {
    if (!WHATSAPP_LAUNCH_ENABLED) {
      setWhatsAppLoading(false);
      return;
    }
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

  const refreshLanguageMemory = useCallback(async () => {
    try {
      const rows = await fetchLanguageMemories();
      setLanguageMemories(rows);
    } catch (error) {
      console.error("Failed to load NANTI language memory:", error);
    } finally {
      setLanguageLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLanguageMemory();
  }, [refreshLanguageMemory]);

  const refreshContextMemory = useCallback(async () => {
    try {
      const [aliases, learnedRoutines] = await Promise.all([
        fetchEntityAliases(),
        fetchUserRoutines(),
      ]);
      setEntityAliases(aliases);
      setRoutines(learnedRoutines);
    } catch (error) {
      console.error("Failed to load NANTI context memory:", error);
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshContextMemory();
  }, [refreshContextMemory]);

  const refreshAssistantQuality = useCallback(async () => {
    if (!isAdmin) {
      setQualityLoading(false);
      return;
    }
    try {
      const result = await fetchAssistantQuality();
      setQualityRuns(result.runs || []);
    } catch (error) {
      console.error("Failed to load NANTI AI quality:", error);
    } finally {
      setQualityLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void refreshAssistantQuality();
  }, [refreshAssistantQuality]);

  const refreshCalendar = useCallback(async () => {
    if (!CALENDAR_LAUNCH_ENABLED) {
      setCalendarLoading(false);
      return;
    }
    try {
      const result = await fetchGoogleCalendarStatus();
      setCalendarStatus(result);
    } catch (error) {
      console.error("Failed to load Google Calendar status:", error);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCalendar();
  }, [refreshCalendar]);

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

  const toggleLanguageMemory = async (memory: LanguageMemoryRow) => {
    try {
      const updated = await setLanguageMemoryActive({
        data: { id: memory.id, active: !memory.active },
      });
      setLanguageMemories((current) =>
        current.map((item) => (item.id === memory.id ? updated : item)),
      );
    } catch (error) {
      console.error("Failed to update NANTI learning:", error);
      toast.error("Could not update that learned pattern.");
    }
  };

  const removeLanguageMemory = async (memory: LanguageMemoryRow) => {
    try {
      await deleteLanguageMemory({ data: { id: memory.id } });
      setLanguageMemories((current) => current.filter((item) => item.id !== memory.id));
      toast.success("NANTI forgot that learned pattern.");
    } catch (error) {
      console.error("Failed to delete NANTI learning:", error);
      toast.error("Could not remove that learned pattern.");
    }
  };

  const languageMeaning = (memory: LanguageMemoryRow) => {
    const value = memory.learned_value || {};
    if (typeof value.meaning === "string") return value.meaning;
    if (typeof value.offsetMinutes === "number") {
      return `${value.offsetMinutes} minutes before`;
    }
    if (typeof value.intent === "string") {
      const after = value.after && typeof value.after === "object"
        ? JSON.stringify(value.after)
        : "";
      return [`Correction: ${value.intent}`, after].filter(Boolean).join(" · ").slice(0, 220);
    }
    if (typeof value.field === "string") {
      return `${value.field}: ${String(value.answer || "")}`;
    }
    return JSON.stringify(value).slice(0, 220);
  };

  const toggleEntityAlias = async (alias: EntityAliasRow) => {
    try {
      const updated = await setEntityAliasActive({
        data: { id: alias.id, active: !alias.active },
      });
      setEntityAliases((current) =>
        current.map((item) => (item.id === alias.id ? updated : item)),
      );
    } catch (error) {
      console.error("Failed to update entity alias:", error);
      toast.error("Could not update that alias.");
    }
  };

  const removeEntityAlias = async (alias: EntityAliasRow) => {
    try {
      await deleteEntityAlias({ data: { id: alias.id } });
      setEntityAliases((current) => current.filter((item) => item.id !== alias.id));
      toast.success("Alias removed.");
    } catch (error) {
      console.error("Failed to remove entity alias:", error);
      toast.error("Could not remove that alias.");
    }
  };

  const toggleRoutine = async (routine: UserRoutineRow) => {
    try {
      const updated = await setUserRoutineActive({
        data: { id: routine.id, active: !routine.active },
      });
      setRoutines((current) =>
        current.map((item) => (item.id === routine.id ? updated : item)),
      );
    } catch (error) {
      console.error("Failed to update routine memory:", error);
      toast.error("Could not update that routine.");
    }
  };

  const removeRoutine = async (routine: UserRoutineRow) => {
    try {
      await deleteUserRoutine({ data: { id: routine.id } });
      setRoutines((current) => current.filter((item) => item.id !== routine.id));
      toast.success("Routine forgotten.");
    } catch (error) {
      console.error("Failed to remove routine:", error);
      toast.error("Could not remove that routine.");
    }
  };

  const routineSummary = (routine: UserRoutineRow) => {
    const value = routine.learned_value || {};
    return [
      typeof value.where === "string" ? `where: ${value.where}` : "",
      typeof value.time === "string" ? `time: ${value.time}` : "",
      typeof value.person === "string" ? `with: ${value.person}` : "",
      typeof value.project === "string" ? `project: ${value.project}` : "",
      typeof value.reminderOffsetMinutes === "number"
        ? `remind ${value.reminderOffsetMinutes}m before`
        : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Recurring action pattern";
  };

  const runQualityCheck = async () => {
    if (qualityRunning) return;
    setQualityRunning(true);
    try {
      const result = await runAssistantSmokeCheck();
      setQualityRuns((current) => [
        result.run,
        ...current.filter((item) => item.id !== result.run.id),
      ].slice(0, 14));
      if (result.cached) {
        toast.success("Using the latest AI quality check from the last 10 minutes.");
      } else if (
        result.run.critical_failures.length === 0 &&
        result.run.score >= 0.8
      ) {
        toast.success(`NANTI AI check passed: ${Math.round(result.run.score * 100)}%.`);
      } else {
        toast.error("NANTI AI check found a behavior that needs attention.");
      }
    } catch (error) {
      console.error("Failed to run NANTI AI quality check:", error);
      toast.error("Could not run the AI quality check.");
    } finally {
      setQualityRunning(false);
    }
  };

  const shortSha = (sha?: string | null) => sha?.slice(0, 7) || "None";

  const formatQualityTime = (value: string) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const connectCalendar = async () => {
    if (calendarAction) return;
    setCalendarAction("connect");
    try {
      const result = await startGoogleCalendarConnect({
        data: { origin: window.location.origin },
      });
      window.location.href = result.url;
    } catch (error) {
      console.error("Failed to start Google Calendar connection:", error);
      toast.error("Google Calendar is not ready on this deployment yet.");
      setCalendarAction(null);
    }
  };

  const syncCalendar = async () => {
    if (calendarAction) return;
    setCalendarAction("sync");
    try {
      const result = await syncGoogleCalendarNow();
      await refreshCalendar();
      toast.success(
        result.synced
          ? `Calendar synced · ${result.synced} events`
          : "Calendar is up to date.",
      );
    } catch (error) {
      console.error("Google Calendar sync failed:", error);
      toast.error("Calendar sync failed. Reconnect if this keeps happening.");
    } finally {
      setCalendarAction(null);
    }
  };

  const disconnectCalendar = async () => {
    if (calendarAction) return;
    setCalendarAction("disconnect");
    try {
      await disconnectGoogleCalendar();
      setCalendarStatus({
        connected: false,
        status: "disconnected",
        last_synced_at: null,
        next_event: null,
      });
      toast.success("Google Calendar disconnected.");
    } catch (error) {
      console.error("Google Calendar disconnect failed:", error);
      toast.error("Could not disconnect Google Calendar.");
    } finally {
      setCalendarAction(null);
    }
  };

  const formatCalendarTime = (value?: string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  };

  const downloadAccountData = async () => {
    if (accountExporting) return;
    setAccountExporting(true);
    try {
      const payload = await exportMyNantiData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `nanti-data-${date}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Your NANTI data export is ready.");
    } catch (error) {
      console.error("NANTI data export failed:", error);
      toast.error("Could not export your data.");
    } finally {
      setAccountExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (accountDeleting || deleteConfirmation !== "DELETE MY ACCOUNT") return;
    setAccountDeleting(true);
    try {
      await deleteMyNantiAccount({
        data: { confirmation: "DELETE MY ACCOUNT" },
      });
      await signOut();
      await navigate({ to: "/auth/signup" });
    } catch (error) {
      console.error("NANTI account deletion failed:", error);
      toast.error("Could not delete your account. Please try again.");
      setAccountDeleting(false);
    }
  };

  const testPushNotification = async () => {
    if (pushTesting || !isSubscribed || !pushConfigured) return;
    setPushTesting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No authenticated session");

      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Test notification could not be delivered.",
        );
      }
      toast.success("Test notification sent.");
    } catch (error) {
      console.error("Push test failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Test notification could not be delivered.",
      );
    } finally {
      setPushTesting(false);
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
          Account
        </h2>
        <div className="rounded-lg border border-border p-4">
          <p className="text-[13px] font-medium">{user?.email || "Signed-in account"}</p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
            Your tasks, People memory, projects, and preferences are private to this account.
          </p>
        </div>
      </section>

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

      {isAdmin ? (
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                AI Quality
              </h2>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Live checks against the same Ask NANTI behavior used in production.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={qualityRunning}
            onClick={() => void runQualityCheck()}
          >
            {qualityRunning ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 size-3.5" />
            )}
            Run check
          </Button>
        </div>

        {qualityLoading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Loading AI quality…
          </div>
        ) : qualityRuns.length ? (
          <div className="space-y-4">
            {(() => {
              const latest = qualityRuns[0]!;
              const healthy =
                latest.critical_failures.length === 0 && latest.score >= 0.8;
              return (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {healthy ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <AlertTriangle className="size-4 text-destructive" />
                        )}
                        <p className="text-sm font-medium">
                          {healthy ? "AI behavior healthy" : "AI quality needs attention"}
                        </p>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {latest.passed}/{latest.total} checks passed · {formatQualityTime(latest.created_at)}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {Math.round(latest.score * 100)}%
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span>Model: {latest.model || "default"}</span>
                    <span>Deploy: {shortSha(latest.git_sha)}</span>
                    {latest.duration_ms ? (
                      <span>{(latest.duration_ms / 1000).toFixed(1)}s</span>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Recent checks
              </p>
              <div className="divide-y divide-border border-y border-border">
                {qualityRuns.slice(0, 7).map((run) => {
                  const healthy =
                    run.critical_failures.length === 0 && run.score >= 0.8;
                  return (
                    <div
                      key={run.id}
                      className="flex items-center justify-between gap-3 py-2.5 text-[12px]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            healthy ? "bg-primary" : "bg-destructive",
                          )}
                        />
                        <span className="truncate text-muted-foreground">
                          {formatQualityTime(run.created_at)} · {run.suite}
                        </span>
                      </div>
                      <span className="font-medium tabular-nums">
                        {Math.round(run.score * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {qualityRuns[0]!.failures?.length ? (
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-destructive/80">
                  Needs attention
                </p>
                <div className="space-y-2">
                  {qualityRuns[0]!.failures.slice(0, 4).map((failure, index) => (
                    <div
                      key={failure.id || index}
                      className="rounded-md border border-destructive/20 p-3"
                    >
                      <p className="text-[12.5px] font-medium">
                        {failure.input || failure.id || "Assistant behavior mismatch"}
                      </p>
                      {failure.errors?.length ? (
                        <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                          {failure.errors.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-[13px] font-medium">No live AI quality run yet.</p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              The scheduled production monitor will create one automatically, or run a smoke check now.
            </p>
          </div>
        )}
      </section>

      ) : null}

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="size-4 text-primary" />
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            What NANTI learned
          </h2>
        </div>
        <p className="mb-4 text-[12.5px] leading-5 text-muted-foreground">
          NANTI learns your shorthand, corrections, aliases, and reminder habits. Teach it in chat,
          for example: “kalau aku bilang OTW, maksudnya on the way.”
        </p>

        {languageLoading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Loading personal learning…
          </div>
        ) : languageMemories.length ? (
          <div className="divide-y divide-border rounded-lg border border-border">
            {languageMemories.slice(0, 20).map((memory) => (
              <div key={memory.id} className="flex items-start gap-3 p-3">
                <Switch
                  className="mt-0.5"
                  checked={memory.active}
                  onCheckedChange={() => void toggleLanguageMemory(memory)}
                  aria-label={`${memory.active ? "Disable" : "Enable"} learned pattern ${memory.pattern_text}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[13px] font-medium">{memory.pattern_text}</p>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                      {memory.memory_type.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                    {languageMeaning(memory)}
                  </p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground/60">
                    {Math.round(memory.confidence * 100)}% confidence · {memory.evidence_count} evidence
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete learned pattern ${memory.pattern_text}`}
                  onClick={() => void removeLanguageMemory(memory)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-[12.5px] text-muted-foreground">
            Nothing learned yet. Correct NANTI naturally or teach it a phrase in Ask NANTI.
          </div>
        )}

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            People, projects & places
          </p>
          {contextLoading ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading entity memory…
            </div>
          ) : entityAliases.length ? (
            <div className="mt-3 divide-y divide-border rounded-lg border border-border">
              {entityAliases.slice(0, 12).map((alias) => (
                <div key={alias.id} className="flex items-start gap-3 p-3">
                  <Switch
                    className="mt-0.5"
                    checked={alias.active}
                    onCheckedChange={() => void toggleEntityAlias(alias)}
                    aria-label={`${alias.active ? "Disable" : "Enable"} alias ${alias.alias_text}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">
                      {alias.alias_text}
                      {alias.alias_text !== alias.canonical_name ? (
                        <span className="font-normal text-muted-foreground">
                          {" "}→ {alias.canonical_name}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[10.5px] text-muted-foreground/60">
                      {alias.entity_type} · {Math.round(alias.confidence * 100)}% confidence · {alias.evidence_count} evidence
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete alias ${alias.alias_text}`}
                    onClick={() => void removeEntityAlias(alias)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              No aliases learned yet.
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Detected routines
          </p>
          <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
            Repeated behavior becomes context after multiple observations. A routine never creates a task by itself.
          </p>
          {contextLoading ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Learning routines…
            </div>
          ) : routines.length ? (
            <div className="mt-3 divide-y divide-border rounded-lg border border-border">
              {routines.slice(0, 12).map((routine) => (
                <div key={routine.id} className="flex items-start gap-3 p-3">
                  <Switch
                    className="mt-0.5"
                    checked={routine.active}
                    onCheckedChange={() => void toggleRoutine(routine)}
                    aria-label={`${routine.active ? "Disable" : "Enable"} routine ${routine.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{routine.title}</p>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                      {routineSummary(routine)}
                    </p>
                    <p className="mt-1 text-[10.5px] text-muted-foreground/60">
                      {routine.evidence_count} observations · {Math.round(routine.confidence * 100)}% confidence
                      {routine.evidence_count < 2 && routine.confidence < 0.85 ? " · still learning" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete routine ${routine.title}`}
                    onClick={() => void removeRoutine(routine)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              No recurring patterns detected yet.
            </p>
          )}
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
          Daily Briefing
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13.5px]">Morning chief-of-staff brief</p>
            <p className="text-[12px] text-muted-foreground">
              One summary of what is due, overdue, waiting, and unclear
            </p>
          </div>
          <Switch
            checked={settings.notifications["Briefing harian"] !== false}
            onCheckedChange={(enabled) =>
              void setSettings({
                notifications: {
                  ...settings.notifications,
                  "Briefing harian": enabled,
                },
              })
            }
          />
        </div>
        <div className="mt-4 max-w-40">
          <Label className="text-[12px]">Briefing time · Jakarta</Label>
          <Input
            type="time"
            className="mt-1"
            value={settings.briefingTime}
            disabled={settings.notifications["Briefing harian"] === false}
            onChange={(event) => void setSettings({ briefingTime: event.target.value })}
          />
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
          <div className={WHATSAPP_LAUNCH_ENABLED ? "py-3" : "hidden"}>
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
          <div className={CALENDAR_LAUNCH_ENABLED ? "py-3" : "hidden"}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13.5px]">Google Calendar <span className="text-[10px] text-muted-foreground">Beta</span></p>
                <p className="text-[12px] text-muted-foreground">
                  {calendarStatus?.connected
                    ? calendarStatus.last_synced_at
                      ? `Last synced ${formatCalendarTime(calendarStatus.last_synced_at)}`
                      : "Connected · waiting for first sync"
                    : calendarStatus?.status === "failed"
                      ? "Connection needs attention"
                      : "Use your schedule as context in Ask NANTI"}
                </p>
                {calendarStatus?.next_event ? (
                  <p className="mt-1 max-w-sm truncate text-[11px] text-muted-foreground/70">
                    Next: {calendarStatus.next_event.title} · {formatCalendarTime(calendarStatus.next_event.start_date)}
                  </p>
                ) : null}
              </div>

              {calendarLoading ? (
                <Loader2 className="mt-1 size-4 animate-spin text-muted-foreground" />
              ) : calendarStatus?.connected ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(calendarAction)}
                    onClick={() => void syncCalendar()}
                  >
                    {calendarAction === "sync" ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1.5 size-3.5" />
                    )}
                    Sync
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(calendarAction)}
                    onClick={() => void disconnectCalendar()}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(calendarAction)}
                  onClick={() => void connectCalendar()}
                >
                  {calendarAction === "connect" ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : null}
                  {calendarStatus?.status === "failed" ? "Reconnect" : "Connect"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={PUSH_LAUNCH_ENABLED ? "mb-10" : "hidden"}>
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
                {!pushConfigured
                  ? "Not configured"
                  : permission === "granted"
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
              disabled={pushLoading || !pushConfigured}
              onClick={isSubscribed ? unsubscribe : subscribe}
            >
              {pushLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : !pushConfigured ? (
                "Unavailable"
              ) : isSubscribed ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </Button>
          )}
        </div>
        {isSubscribed && pushConfigured ? (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={pushTesting || pushLoading}
              onClick={() => void testPushNotification()}
            >
              {pushTesting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Send test notification
            </Button>
          </div>
        ) : null}
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Account & data
        </h2>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={accountExporting}
            onClick={() => void downloadAccountData()}
          >
            {accountExporting ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            Download my data
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteAccountOpen((open) => !open)}
          >
            Delete account
          </Button>
        </div>

        {deleteAccountOpen ? (
          <div className="mt-4 max-w-lg rounded-lg border border-destructive/20 p-4">
            <p className="text-[13px] font-medium text-destructive">
              Permanently delete this NANTI account
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              This removes your tasks, People memory, projects, conversations,
              learned preferences, notifications, and connected Calendar data.
              This cannot be undone.
            </p>
            <Label htmlFor="delete-account-confirmation" className="mt-4 block text-[12px]">
              Type DELETE MY ACCOUNT to confirm
            </Label>
            <Input
              id="delete-account-confirmation"
              className="mt-1"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              variant="destructive"
              size="sm"
              className="mt-3"
              disabled={
                accountDeleting || deleteConfirmation !== "DELETE MY ACCOUNT"
              }
              onClick={() => void deleteAccount()}
            >
              {accountDeleting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Permanently delete account
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
