import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Hourglass,
  MessageSquareText,
  Sparkles,
  Zap,
} from "lucide-react";
import { MarketingLayout, FloatingCard, AccentChip } from "@/components/nanti/marketing";
import { Logo } from "@/components/nanti/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NANTI · Your AI memory for WhatsApp" },
      {
        name: "description",
        content:
          "Forward or paste a WhatsApp conversation and NANTI turns it into tracked commitments, reminders, and follow-ups. Nothing gets buried in the scroll.",
      },
      { property: "og:title", content: "NANTI · Your AI memory for WhatsApp" },
      {
        property: "og:description",
        content:
          "Forward or paste a WhatsApp conversation and NANTI turns it into tracked commitments, reminders, and follow-ups. Nothing gets buried in the scroll.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <Hero />
      <HowItWorks />
      <Capabilities />
      <UseCases />
      <PrivacyTrust />
      <FinalCta />
    </MarketingLayout>
  );
}
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-[var(--accent-emerald)]">AI Work Memory for WhatsApp</p>
            <h1 className="display-lg mt-6 text-foreground" style={{ fontSize: "clamp(1.125rem, 2.6vw, 2rem)", fontWeight: 800 }}>
              Your WhatsApp remembers everything you typed.
              <br />
              <span className="text-[var(--accent-emerald)]">NANTI</span> remembers what you
              promised.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground lg:mx-0">
              Forward or paste a conversation, and NANTI turns it into tasks, deadlines, and
              follow-ups — so nothing gets buried in the scroll.
            </p>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
              <Link
                to="/welcome"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background transition-opacity hover:opacity-90"
              >
                Start using NANTI
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-surface"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="relative hidden h-[380px] lg:block">
            <div className="absolute left-0 top-0 w-[280px] rotate-[-6deg] rounded-2xl border border-border bg-background p-5 shadow-soft transition-transform hover:rotate-[-4deg]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#25D366]/15">
                  <MessageSquareText className="size-4 text-[#128C7E]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">Budi — PT ABC</p>
                  <p className="text-[11px] text-muted-foreground">Group · 14:32</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl rounded-tl-sm bg-[#dcf8c6] px-3.5 py-2 text-[13px] text-[#303030]">
                  Pak, untuk order yang 500 pcs itu mereka minta update price hari ini ya.
                </div>
                <div className="rounded-xl rounded-tl-sm bg-[#dcf8c6] px-3.5 py-2 text-[13px] text-[#303030]">
                  Besok saya kirim revisi quotation-nya.
                </div>
              </div>
            </div>

            <div className="absolute left-[180px] top-[120px] z-10 rotate-[3deg] rounded-full border border-border/60 bg-background/80 px-4 py-2 text-[12px] font-medium text-muted-foreground backdrop-blur-sm">
              ↩︎ Forwarded to NANTI
            </div>

            <div className="absolute bottom-0 left-[60px] w-[300px] rotate-[-2deg] rounded-2xl border border-border bg-foreground p-5 text-background shadow-lift transition-transform hover:rotate-0">
              <div className="mb-3 flex items-center gap-2">
                <Logo showWord={false} />
                <span className="text-[12px] font-semibold uppercase tracking-wider opacity-70">
                  Commitment detected
                </span>
              </div>
              <p className="text-[15px] font-semibold">Send revised quotation</p>
              <div className="mt-3 flex items-center gap-3 text-[12.5px] opacity-60">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> Due tomorrow
                </span>
                <span>Budi · PT ABC</span>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="rounded-lg bg-[#25D366] px-3 py-1.5 text-[12px] font-semibold text-[#08301f]">
                  Track
                </span>
                <span className="rounded-lg border border-background/20 px-3 py-1.5 text-[12px] font-medium opacity-70">
                  Dismiss
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            <div className="rounded-2xl border border-border bg-background p-5 shadow-soft">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquareText className="size-4 text-[#128C7E]" />
                <span className="text-[13px] font-semibold">Budi — PT ABC</span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                "Besok saya kirim revisi quotation-nya."
              </p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/80 px-4 py-2 text-center text-[12px] font-medium text-muted-foreground">
              ↩︎ Forwarded to NANTI
            </div>
            <div className="rounded-2xl border border-border bg-foreground p-5 text-background shadow-lift">
              <div className="mb-2 flex items-center gap-2">
                <Logo showWord={false} />
                <span className="text-[12px] font-semibold uppercase tracking-wider opacity-70">
                  Commitment detected
                </span>
              </div>
              <p className="text-[15px] font-semibold">Send revised quotation</p>
              <p className="mt-1 text-[12.5px] opacity-60">Due tomorrow · Budi · PT ABC</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function HowItWorks() {
  const steps = [
    {
      num: "01",
      color: "emerald" as const,
      icon: MessageSquareText,
      title: "The message",
      desc: "Forward the message, or paste the conversation. NANTI reads it, and remembers what needs remembering.",
      example: "Besok saya kirim revisinya ya Pak.",
    },
    {
      num: "02",
      color: "teal" as const,
      icon: Brain,
      title: "NANTI AI",
      desc: "NANTI reads it the way a sharp assistant would — spotting real commitments and skipping the small talk.",
      example: "Commitment detected · Send revised quotation · Due tomorrow",
    },
    {
      num: "03",
      color: "lime" as const,
      icon: CheckCircle2,
      title: "Remembered",
      desc: "The commitment appears in your workspace. NANTI follows up so you don't have to.",
      example: "Tracked · Reminder set · Follow-up drafted",
    },
  ];

  return (
    <section className="border-y border-border bg-surface py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display-lg text-foreground">
            You don&apos;t create tasks. You just talk.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Forward the message, or paste the conversation. NANTI reads it, and remembers what needs
            remembering.
          </p>
        </div>

        <div className="mt-16 space-y-6">
          {steps.map((step, i) => (
            <FloatingCard
              key={step.num}
              className={"rise"}
              style={{ animationDelay: `${i * 80}ms` } as React.CSSProperties}
            >
              <div className="flex items-start gap-5">
                <AccentChip color={step.color}>
                  <step.icon className="size-5" />
                </AccentChip>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {step.num}
                  </p>
                  <h3 className="mt-1.5 text-[19px] font-semibold">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                  <div className="mt-3 rounded-xl bg-surface px-4 py-2.5 text-[13.5px] text-muted-foreground">
                    {step.example}
                  </div>
                </div>
              </div>
            </FloatingCard>
          ))}
        </div>
      </div>
    </section>
  );
}
function Capabilities() {
  const items = [
    {
      num: "01",
      color: "emerald" as const,
      icon: Brain,
      title: "Remember",
      desc: "Never lose a promise again. NANTI catches commitments hiding inside ordinary conversation.",
    },
    {
      num: "02",
      color: "teal" as const,
      icon: Zap,
      title: "Prioritize",
      desc: "Know what matters today, not just what's loudest. NANTI turns scattered conversations into one clear daily briefing.",
    },
    {
      num: "03",
      color: "lime" as const,
      icon: Hourglass,
      title: "Follow Up",
      desc: "Know exactly who owes you what. Approvals, replies, payments, documents, decisions — all tracked, none forgotten.",
    },
    {
      num: "04",
      color: "mint" as const,
      icon: ArrowRight,
      title: "Act",
      desc: "Close the loop. NANTI can draft the follow-up message for you to send — so replying takes seconds, not willpower.",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item, i) => (
            <FloatingCard
              key={item.num}
              className={"rise"}
              style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-[var(--accent-emerald)]">
                  {item.num}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-5 flex items-start gap-4">
                <AccentChip color={item.color}>
                  <item.icon className="size-5" />
                </AccentChip>
                <div>
                  <h3 className="text-[20px] font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            </FloatingCard>
          ))}
        </div>
      </div>
    </section>
  );
}
function UseCases() {
  const cases = [
    {
      title: "For Business Owners",
      desc: "Your business runs through WhatsApp. NANTI keeps the commitments moving.",
      link: "/business",
      color: "teal" as const,
    },
    {
      title: "For Professionals",
      desc: "Everything tracked. Nothing living rent-free in your head.",
      link: "/business",
      color: "lime" as const,
    },
    {
      title: "For Personal",
      desc: "From work to family, remember what matters.",
      link: "/personal",
      color: "forest" as const,
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {cases.map((uc, i) => (
            <Link key={uc.title} to={uc.link} className="group">
              <FloatingCard
                className="rise h-full transition-shadow group-hover:shadow-lift"
                style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}
              >
                <AccentChip color={uc.color} className="mb-4">
                  <Sparkles className="size-5" />
                </AccentChip>
                <h3 className="text-[18px] font-semibold">{uc.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
                  {uc.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--accent-emerald)]">
                  Learn more
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </FloatingCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
function PrivacyTrust() {
  return (
    <section className="border-t border-border bg-surface py-20">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-background border border-border">
          <Brain className="size-7 text-[var(--accent-emerald)]" />
        </div>
        <h2 className="mt-6 text-[28px] font-semibold tracking-tight sm:text-[32px]">
          Your conversations are yours.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          NANTI only sees what you forward or paste — never your whole WhatsApp. Nothing is sold,
          nothing is shared, and everything is yours to delete.
        </p>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="display-lg text-foreground">Stop remembering everything.</h2>
        <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
          Forward the message. Let NANTI remember the rest.
        </p>
        <Link
          to="/welcome"
          className="mt-9 inline-flex items-center gap-2 rounded-xl bg-foreground px-7 py-4 text-[16px] font-semibold text-background transition-opacity hover:opacity-90"
        >
          Get started
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
