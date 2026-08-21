import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings · NANTI" },
      { name: "description", content: "Set your name, daily briefing time, end-of-day sweep and notifications." },
      { property: "og:title", content: "Settings · NANTI" },
      { property: "og:description", content: "Tune NANTI's reminder rhythm to your workday." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, setSettings, reset } = useNanti();
  const { signOut } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Berhasil keluar.");
    navigate({ to: "/auth/login" });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Tune NANTI to your workday" />

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Profile</h2>
        <Label className="text-[13px]">Display name</Label>
        <Input
          className="mt-1.5 bg-surface"
          value={settings.name}
          onChange={(e) => setSettings({ name: e.target.value })}
        />
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Reminder times</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-[13px]">Daily briefing</Label>
            <Input
              type="time"
              className="mt-1.5 bg-surface"
              value={settings.briefingTime}
              onChange={(e) => setSettings({ briefingTime: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[13px]">End-of-day sweep</Label>
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
        <h2 className="mb-2 text-[14px] font-semibold">Notifications</h2>
        {Object.entries(settings.notifications).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-border/60 py-3 last:border-0">
            <span className="text-[13.5px]">{k}</span>
            <Switch
              checked={v}
              onCheckedChange={(c) => setSettings({ notifications: { ...settings.notifications, [k]: c } })}
            />
          </div>
        ))}
      </div>

      <div className="card-soft p-5">
        <h2 className="mb-1 text-[14px] font-semibold">WhatsApp integration</h2>
        <p className="text-[13px] text-muted-foreground">
          Direct WhatsApp connection is not yet active. For now, import conversations manually — NANTI's
          architecture is ready for automatic integration later.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => { reset(); toast.success("Demo data restored"); }}
        >
          Restore demo data
        </Button>
      </div>

      <div className="card-soft p-5">
        <h2 className="mb-1 text-[14px] font-semibold">Akun</h2>
        <p className="text-[13px] text-muted-foreground">
          Keluar dari akun NANTI Anda.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-4"
          onClick={handleSignOut}
        >
          Keluar
        </Button>
      </div>
    </div>
  );
}
