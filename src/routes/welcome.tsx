import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Logo } from "@/components/nanti/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNanti } from "@/lib/nanti-store";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import type { ConversationTone, FocusArea, ReminderChannel } from "@/lib/nanti-types";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

function Welcome() {
  const { setSettings, settings } = useNanti();
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (settings.onboarded) {
      navigate({ to: "/app/today" });
    }
  }, [user, loading, settings.onboarded, navigate]);

  if (loading || !user || settings.onboarded) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <h1 className="text-[28px] font-bold tracking-tight">Welcome to NANTI</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Your WhatsApp is full of work. NANTI makes sure nothing gets forgotten.
        </p>

        <Button
          className="mt-8 w-full"
          size="lg"
          onClick={() => {
            setSettings({ onboarded: true });
            navigate({ to: "/app/import" });
          }}
        >
          Start
        </Button>
      </div>

      <p className="mt-10 text-center text-[12px] text-muted-foreground">
        Never lose a commitment in WhatsApp again.
      </p>
    </div>
  );
}
