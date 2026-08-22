import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import type {
  ConversationTone,
  AppLanguage,
  ReminderChannel,
  ReminderIntensity,
} from "@/lib/nanti-types";
import { cn } from "@/lib/utils";
import { Check, Bell, BellOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings · NANTI" },
      { name: "description", content: "Tune NANTI reminder rhythm to your workday." },
      { property: "og:title", content: "Settings · NANTI" },
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

const languageOptions: { id: AppLanguage; label: string }[] = [
  { id: "indonesian", label: "Bahasa Indonesia" },
  { id: "english", label: "English" },
  { id: "mix", label: "Indonesia + English" },
];

const channelOpts: { id: ReminderChannel; label: string; desc: string }[] = [
  { id: "whatsapp", label: "WhatsApp", desc: "Pesan langsung" },
  { id: "push", label: "Push notification", desc: "Notifikasi ponsel" },
  { id: "calendar", label: "Google Calendar", desc: "Event kalender" },
  { id: "in_app", label: "Di dalam app", desc: "Notifikasi NANTI" },
];

const intensityOpts: { id: ReminderIntensity; label: string; desc: string }[] = [
  { id: "gentle", label: "Lembut", desc: "Sekali saat jatuh tempo" },
  { id: "normal", label: "Normal", desc: "Sebelum + saat jatuh tempo" },
  { id: "persistent", label: "Terus-menerus", desc: "Sebelum + saat + lewat jatuh tempo" },
];

function SettingsPage() {
  const { settings, setSettings, reset } = useNanti();
  const { signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const {
    isSubscribed,
    permission,
    loading: pushLoading,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Berhasil keluar.");
    navigate({ to: "/auth/login" });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Tune NANTI to your workday" />

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Profil</h2>
        <Label className="text-[13px]">Nama panggilan</Label>
        <Input
          className="mt-1.5 bg-surface"
          value={settings.preferredName || settings.name}
          onChange={(e) => setSettings({ preferredName: e.target.value, name: e.target.value })}
        />
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Bahasa & Gaya</h2>
        <Label className="text-[13px]">Bahasa</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {languageOptions.map((l) => (
            <button
              key={l.id}
              onClick={() => setSettings({ language: l.id })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                settings.language === l.id
                  ? "border-primary bg-accent/50 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40",
              )}
            >
              {settings.language === l.id && <Check className="mr-1 inline size-3" />}
              {l.label}
            </button>
          ))}
        </div>
        <Label className="mt-4 text-[13px]">Gaya bicara NANTI</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {toneOptions.map((t) => (
            <button
              key={t.id}
              onClick={() => setSettings({ tone: t.id })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                settings.tone === t.id
                  ? "border-primary bg-accent/50 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40",
              )}
            >
              {settings.tone === t.id && <Check className="mr-1 inline size-3" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Waktu Pengingat</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-[13px]">Briefing harian</Label>
            <Input
              type="time"
              className="mt-1.5 bg-surface"
              value={settings.briefingTime}
              onChange={(e) => setSettings({ briefingTime: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[13px]">Sapuan akhir hari</Label>
            <Input
              type="time"
              className="mt-1.5 bg-surface"
              value={settings.endOfDayTime}
              onChange={(e) => setSettings({ endOfDayTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Channel Pengingat</h2>
        {channelOpts.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center justify-between border-b border-border/60 py-3 last:border-0"
          >
            <div>
              <span className="text-[13.5px] font-medium">{ch.label}</span>
              <span className="ml-2 text-[12px] text-muted-foreground">{ch.desc}</span>
            </div>
            <Switch
              checked={settings.reminderChannels.includes(ch.id)}
              onCheckedChange={() => {
                const current = settings.reminderChannels;
                const next = current.includes(ch.id)
                  ? current.filter((c) => c !== ch.id)
                  : [...current, ch.id];
                setSettings({ reminderChannels: next });
              }}
            />
          </div>
        ))}
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Intensitas Pengingat</h2>
        <div className="space-y-2">
          {intensityOpts.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSettings({ reminderIntensity: opt.id })}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
                settings.reminderIntensity === opt.id
                  ? "border-primary bg-accent/50"
                  : "border-border bg-surface hover:border-primary/40",
              )}
            >
              <div>
                <p className="text-[13.5px] font-medium">{opt.label}</p>
                <p className="text-[12px] text-muted-foreground">{opt.desc}</p>
              </div>
              {settings.reminderIntensity === opt.id && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      <div className="card-soft mb-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold">Jam Tenang</h2>
            <p className="text-[12px] text-muted-foreground">Jangan kirim pengingat non-mendesak</p>
          </div>
          <Switch
            checked={settings.quietHoursEnabled}
            onCheckedChange={(c) => setSettings({ quietHoursEnabled: c })}
          />
        </div>
        {settings.quietHoursEnabled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px]">Mulai</Label>
              <Input
                type="time"
                className="mt-1.5 bg-surface"
                value={settings.quietHoursStart}
                onChange={(e) => setSettings({ quietHoursStart: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-[13px]">Selesai</Label>
              <Input
                type="time"
                className="mt-1.5 bg-surface"
                value={settings.quietHoursEnd}
                onChange={(e) => setSettings({ quietHoursEnd: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Notifikasi</h2>
        <div className="flex items-center justify-between border-b border-border/60 py-3">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="size-4 text-primary" />
            ) : (
              <BellOff className="size-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-[13.5px] font-medium">Push Notification</p>
              <p className="text-[12px] text-muted-foreground">
                {permission === "granted"
                  ? "Aktif — Anda akan menerima notifikasi"
                  : permission === "denied"
                    ? "Diblokir — Aktifkan di pengaturan browser"
                    : "Belum diaktifkan"}
              </p>
            </div>
          </div>
          {permission === "denied" ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">
              Diblokir
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
                "Nonaktifkan"
              ) : (
                "Aktifkan"
              )}
            </Button>
          )}
        </div>
        {Object.entries(settings.notifications).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between border-b border-border/60 py-3 last:border-0"
          >
            <span className="text-[13.5px]">{k}</span>
            <Switch
              checked={v}
              onCheckedChange={(c) =>
                setSettings({ notifications: { ...settings.notifications, [k]: c } })
              }
            />
          </div>
        ))}
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Integrasi</h2>
        <div className="flex items-center justify-between border-b border-border/60 py-3">
          <div>
            <p className="text-[13.5px] font-medium">WhatsApp</p>
            <p className="text-[12px] text-muted-foreground">Koneksi ke WhatsApp Business</p>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {settings.whatsappConnected ? "Tersambung" : "Belum aktif"}
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-[13.5px] font-medium">Google Calendar</p>
            <p className="text-[12px] text-muted-foreground">Sinkron jadwal kalender</p>
          </div>
          {settings.calendarConnected ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              Tersambung
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = `/api/auth/google?state=${settings.preferredName || "user"}`;
              }}
            >
              Hubungkan
            </Button>
          )}
        </div>
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-1 text-[14px] font-semibold">Data</h2>
        <p className="text-[13px] text-muted-foreground">
          Kembalikan data demo untuk melihat cara kerja NANTI.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            reset();
            toast.success("Demo data restored");
          }}
        >
          Restore demo data
        </Button>
      </div>

      <div className="card-soft p-5">
        <h2 className="mb-1 text-[14px] font-semibold">Akun</h2>
        <p className="text-[13px] text-muted-foreground">Keluar dari akun NANTI Anda.</p>
        <Button variant="destructive" size="sm" className="mt-4" onClick={handleSignOut}>
          Keluar
        </Button>
      </div>
    </div>
  );
}
