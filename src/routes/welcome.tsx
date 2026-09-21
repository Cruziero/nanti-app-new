import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Logo } from "@/components/nanti/logo";
import { Input } from "@/components/ui/input";
import { useNanti } from "@/lib/nanti-store";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import type { ConversationTone } from "@/lib/nanti-types";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Get started with NANTI" },
      { name: "description", content: "Your AI memory for WhatsApp conversations." },
    ],
  }),
  component: Welcome,
});

const TONES: { value: ConversationTone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Clear and direct" },
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { value: "formal", label: "Formal", desc: "Polished and structured" },
];

const EXAMPLE_EXTRACT = [
  { label: "WHO", value: "Pak Tom" },
  { label: "WHAT", value: "Send invoice" },
  { label: "WHEN", value: "28 August" },
];

export function Welcome() {
  const { setSettings, settings, hydrated } = useNanti();
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tone, setTone] = useState<ConversationTone>("professional");
  const [showExtraction, setShowExtraction] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (hydrated && settings.onboarded) {
      navigate({ to: "/app/today" });
    }
  }, [user, loading, hydrated, settings.onboarded, navigate]);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => setShowExtraction(true), 800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (loading || !hydrated || !user || settings.onboarded) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-md">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <Logo />
            </div>
            <h1 className="text-[32px] font-bold tracking-tight">
              You talk.
            </h1>
            <h1 className="text-[32px] font-bold tracking-tight text-primary">
              NANTI remembers.
            </h1>
            <p className="mt-4 text-[15px] text-muted-foreground">
              Never lose a commitment in WhatsApp again.
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try one <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* Step 1: Try one */}
        {step === 1 && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>
            <p className="text-[12px] font-medium text-muted-foreground mb-2">Try one</p>

            {/* Example message */}
            <div className="mx-auto max-w-xs rounded-xl border border-border bg-card p-4 text-left">
              <p className="text-[13px] text-foreground italic">
                &ldquo;Nanti saya kirim invoice tanggal 28 Agustus ya Pak Tom.&rdquo;
              </p>
            </div>

            {/* Extraction result */}
            <div className={cn(
              "mx-auto mt-4 max-w-xs transition-all duration-500",
              showExtraction ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-3 text-[11px] font-medium text-primary uppercase tracking-wider">
                  NANTI understands
                </p>
                <div className="space-y-2">
                  {EXAMPLE_EXTRACT.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="w-10 text-[10px] font-semibold text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-[13px] font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className={cn(
                "mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-medium text-primary-foreground transition-all",
                showExtraction
                  ? "opacity-100 hover:bg-primary/90"
                  : "opacity-0 pointer-events-none",
              )}
            >
              Personalize <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* Step 2: Personalize */}
        {step === 2 && (
          <div>
            <div className="mb-8 flex justify-center">
              <Logo />
            </div>
            <h2 className="text-center text-[20px] font-semibold">What should I call you?</h2>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-4 text-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  setSettings({
                    name: name.trim(),
                    tone,
                    onboarded: true,
                  });
                  navigate({ to: "/app/today" });
                }
              }}
            />

            <h2 className="mt-8 text-center text-[20px] font-semibold">How should I remind you?</h2>
            <div className="mt-4 grid gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    tone === t.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      tone === t.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {tone === t.value && <Check className="size-3" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">{t.label}</p>
                    <p className="text-[12px] text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSettings({
                  name: name.trim() || "Friend",
                  tone,
                  onboarded: true,
                });
                navigate({ to: "/app/today" });
              }}
              className="mt-6 w-full rounded-lg bg-primary py-3 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start using NANTI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
