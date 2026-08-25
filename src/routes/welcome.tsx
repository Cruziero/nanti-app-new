import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/nanti/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNanti } from "@/lib/nanti-store";
import type { ConversationTone, FocusArea, ReminderChannel } from "@/lib/nanti-types";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Get started with NANTI" },
      { name: "description", content: "Set up your AI work memory in a few steps." },
      { property: "og:title", content: "Get started with NANTI" },
      { property: "og:description", content: "Jangan biarkan komitmen hilang di WhatsApp lagi." },
    ],
  }),
  component: Welcome,
});

const tones: { id: ConversationTone; label: string; desc: string; example: string }[] = [
  { id: "formal", label: "Formal", desc: "Professional dan sopan", example: "Reminder: Anda memiliki komitmen untuk mengirim invoice hari ini." },
  { id: "professional", label: "Professional", desc: "Langsung dan jelas", example: "Reminder: Invoice untuk Pak Tom perlu dikirim hari ini." },
  { id: "casual", label: "Casual", desc: "Santai dan ramah", example: "Hey Rizky, jangan lupa kirim invoice ke Pak Tom hari ini." },
  { id: "friendly", label: "Friendly", desc: "Hangat dan positif", example: "Halo Rizky! Just checking in — invoice untuk Pak Tom hari ini ya." },
  { id: "warm", label: "Warm", desc: "Penuh perhatian", example: "Rizky, just a little reminder. Invoice untuk Pak Tom hari ini." },
  { id: "loving", label: "Loving", desc: "Penuh kasih sayang", example: "Sayang, jangan lupa invoice untuk Pak Tom hari ini ya." },
  { id: "direct", label: "Direct", desc: "Tanpa basa-basi", example: "Invoice Pak Tom — due today." },
];

const focusAreas: { id: FocusArea; label: string; icon: string }[] = [
  { id: "work", label: "Kerja", icon: "\uD83D\uDCBC" },
  { id: "business", label: "Bisnis", icon: "\uD83C\uDFE2" },
  { id: "personal", label: "Pribadi", icon: "\uD83C\uDFE0" },
  { id: "everything", label: "Semua", icon: "\u2728" },
];

const channelOptions: { id: ReminderChannel; label: string; desc: string; icon: string }[] = [
  { id: "whatsapp", label: "WhatsApp", desc: "Pesan langsung ke WhatsApp", icon: "\uD83D\uDCAC" },
  { id: "push", label: "Push notification", desc: "Notifikasi di ponsel", icon: "\uD83D\uDD14" },
  { id: "calendar", label: "Google Calendar", desc: "Event di kalender", icon: "\uD83D\uDCC5" },
  { id: "in_app", label: "Di dalam app", desc: "Notifikasi di NANTI", icon: "\uD83D\uDCF1" },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full transition-all",
            i <= current ? "w-6 bg-primary" : "w-2 bg-border",
          )}
        />
      ))}
    </div>
  );
}

function Welcome() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedTone, setSelectedTone] = useState<ConversationTone>("professional");
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>("everything");
  const [selectedChannels, setSelectedChannels] = useState<ReminderChannel[]>(["in_app", "push"]);
  const { setSettings } = useNanti();
  const navigate = useNavigate();

  const totalSteps = 5;

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    setSettings({
      onboarded: true,
      preferredName: name || "User",
      name: name || "User",
      tone: selectedTone,
      focusArea: selectedFocus,
      reminderChannels: selectedChannels,
    });
    void navigate({ to: "/app/import" });
  };

  const toggleChannel = (ch: ReminderChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <StepIndicator current={step} total={totalSteps} />
        </div>

        {/* Step 1: Name */}
        {step === 0 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Siapa nama Anda?</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Supaya saya tahu cara memanggil Anda.
            </p>
            <Input
              className="mt-6 bg-surface"
              placeholder="Ketik nama Anda..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && name.trim() && next()}
            />
            <Button className="mt-6 w-full" size="lg" onClick={next} disabled={!name.trim()}>
              Lanjut
            </Button>
          </div>
        )}

        {/* Step 2: Tone */}
        {step === 1 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Bagaimana saya bicara dengan Anda?</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Pilih nada yang paling terasa seperti Anda.
            </p>
            <div className="mt-6 space-y-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTone(t.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    selectedTone === t.id
                      ? "border-primary bg-accent/50"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold">{t.label}</p>
                      <p className="text-[12px] text-muted-foreground">{t.desc}</p>
                    </div>
                    {selectedTone === t.id && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="mt-2 rounded-lg bg-background/60 px-3 py-2 text-[12.5px] italic text-muted-foreground">
                    &quot;{t.example}&quot;
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={prev}>
                Kembali
              </Button>
              <Button className="flex-1" onClick={next}>
                Lanjut
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Focus */}
        {step === 2 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Apa fokus Anda?</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              NANTI akan menyesuaikan cara mengingatkan sesuai fokus Anda.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {focusAreas.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFocus(f.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-5 transition-colors",
                    selectedFocus === f.id
                      ? "border-primary bg-accent/50"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-[14px] font-medium">{f.label}</span>
                  {selectedFocus === f.id && <Check className="size-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={prev}>
                Kembali
              </Button>
              <Button className="flex-1" onClick={next}>
                Lanjut
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Notifications + Calendar */}
        {step === 3 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Notifikasi & Kalender</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Pilih bagaimana NANTI mengingatkan Anda.
            </p>
            <div className="mt-6 space-y-2">
              {channelOptions.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                    selectedChannels.includes(ch.id)
                      ? "border-primary bg-accent/50"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <span className="text-xl">{ch.icon}</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold">{ch.label}</p>
                    <p className="text-[12px] text-muted-foreground">{ch.desc}</p>
                  </div>
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border",
                      selectedChannels.includes(ch.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {selectedChannels.includes(ch.id) && <Check className="size-3" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={prev}>
                Kembali
              </Button>
              <Button className="flex-1" onClick={next} disabled={selectedChannels.length === 0}>
                Lanjut
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Welcome / Try it */}
        {step === 4 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Coba sekarang.</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Kirim satu hal yang tidak boleh Anda lupakan.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-surface p-5">
              <p className="text-[13px] text-muted-foreground">
                Contoh: &quot;nanti saya kirim invoice tgl 28 agustus ya pak Tom&quot;
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                NANTI akan mengingatkan Anda tepat waktu.
              </p>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={finish}>
              Mulai menggunakan NANTI
            </Button>
            <Button variant="outline" className="mt-2 w-full" onClick={prev}>
              Kembali
            </Button>
          </div>
        )}

        <p className="mt-10 text-center text-[12px] text-muted-foreground">
          Jangan biarkan komitmen hilang di WhatsApp lagi.
        </p>
      </div>
    </div>
  );
}
