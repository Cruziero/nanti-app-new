import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/nanti/logo";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Get started with NANTI" },
      { name: "description", content: "Three quick steps to set up your AI work memory." },
      { property: "og:title", content: "Get started with NANTI" },
      { property: "og:description", content: "Never lose a commitment in WhatsApp again." },
    ],
  }),
  component: Welcome,
});

const roles = ["Business owner", "Sales", "Project management", "Operations", "Marketing", "Property", "Other"];
const volumes = ["1–10", "10–30", "30–100", "100+"];

function Welcome() {
  const [step, setStep] = useState(0);
  const { setSettings } = useNanti();
  const navigate = useNavigate();

  const finish = () => {
    setSettings({ onboarded: true });
    void navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <Logo className="mb-10" />

        {step === 0 && (
          <div className="rise">
            <h1 className="text-[30px] font-bold leading-tight">Welcome to NANTI</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Your WhatsApp is full of work. NANTI makes sure nothing gets forgotten.
            </p>
            <Button className="mt-8 w-full" size="lg" onClick={() => setStep(1)}>
              Start
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">What field do you work in?</h1>
            <div className="mt-6 space-y-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => { setSettings({ role: r }); setStep(2); }}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-[14.5px] transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">How many work conversations do you have?</h1>
            <div className="mt-6 space-y-2">
              {volumes.map((v) => (
                <button
                  key={v}
                  onClick={() => { setSettings({ volume: v }); setStep(3); }}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-[14.5px] transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  {v} conversations
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Import your first conversation</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Paste a WhatsApp conversation and see what NANTI finds.
            </p>
            <div className="mt-6 space-y-2">
              <Button className="w-full" size="lg" onClick={() => { setSettings({ onboarded: true }); void navigate({ to: "/app/import" }); }}>
                Paste conversation
              </Button>
              <Button variant="outline" className="w-full" size="lg" onClick={finish}>
                Try with demo data
              </Button>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-[12px] text-muted-foreground">
          Never lose a commitment in WhatsApp again.
        </p>
      </div>
    </div>
  );
}
