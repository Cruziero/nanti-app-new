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
import { MarketingLayout } from "@/components/nanti/marketing";
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
      <ProductPreview />
      <HowItWorks />
      <Capabilities />
      <AiMemorySection />
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
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-primary">AI Work Memory for WhatsApp</p>
          <h1 className="display-xl mt-6 text-foreground">
            Your WhatsApp remembers everything you typed.
            <br />
            <span className="text-primary">NANTI</span> remembers what you promised.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Forward or paste a conversation, and NANTI turns it into tasks, deadlines, and
            follow-ups — so nothing gets buried in the scroll.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section className="relative px-5 pb-24 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-border shadow-lift">
          {/* Browser bar */}
          <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
            <div className="flex gap-1.5">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="mx-auto flex items-center gap-2 rounded-md bg-background px-3 py-1 text-[12px] text-muted-foreground">
              nanti.app/today
            </div>
          </div>
          {/* Preview content */}
          <div className="bg-background p-6 sm:p-10">
            <div className="mx-auto max-w-2xl">
              <p className="text-[22px] font-semibold sm:text-[26px]">Good morning, Rizky.</p>
              <p className="mt-1.5 text-[15px] text-muted-foreground">
                What do you need to get done?
              </p>

              {/* AI input */}
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5">
                <Sparkles className="size-5 shrink-0 text-primary" />
                <span className="flex-1 text-[14.5px] text-muted-foreground">
                  Ask NANTI anything...
                </span>
                <span className="rounded-lg bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background">
                  Ask
                </span>
              </div>

              {/* Suggested prompts */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "What am I forgetting today?",
                  "Who am I waiting for?",
                  "What did I promise this week?",
                ].map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-[12.5px] text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Day at a glance */}
              <div className="mt-8">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Your day at a glance
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { label: "Tasks", value: "7" },
                    { label: "Overdue", value: "2" },
                    { label: "Waiting", value: "5" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-border bg-surface px-4 py-3.5"
                    >
                      <p className="text-[24px] font-bold leading-none">{s.value}</p>
                      <p className="mt-2 text-[12.5px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* NANTI noticed something */}
              <div className="mt-8 rounded-xl border border-primary/25 bg-accent/50 p-5">
                <div className="flex items-center gap-2">
                  <Logo showWord={false} />
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-accent-foreground">
                    NANTI noticed something
                  </p>
                </div>
                <p className="mt-3 text-[14.5px] leading-relaxed">
                  "You promised Budi a revised quotation yesterday, but I couldn't find a follow-up
                  after the conversation."
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground">
                    Follow up
                  </span>
                  <span className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-[12.5px] font-medium">
                    Mark complete
                  </span>
                  <span className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium text-muted-foreground">
                    Dismiss
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display-lg text-foreground">You don't create tasks. You just talk.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Forward the message, or paste the conversation. NANTI reads it, and remembers what needs
            remembering.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {/* Step 1: WhatsApp */}
          <div className="rise rounded-2xl border border-border bg-background p-7">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#25D366]/10">
              <MessageSquareText className="size-5 text-[#128C7E]" />
            </div>
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step 01
            </p>
            <h3 className="mt-2 text-[17px] font-semibold">The message</h3>
            <div className="mt-4 rounded-xl bg-surface p-4">
              <p className="text-[14px] italic leading-relaxed text-muted-foreground">
                "Besok saya kirim revisinya ya Pak."
              </p>
            </div>
          </div>

          {/* Step 2: NANTI AI */}
          <div
            className="rise rounded-2xl border border-border bg-background p-7"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="size-5 text-primary" />
            </div>
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step 02
            </p>
            <h3 className="mt-2 text-[17px] font-semibold">NANTI AI</h3>
            <p className="mt-3 text-[13.5px] font-medium text-primary">Commitment detected</p>
            <div className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
              <p>Send revised quotation</p>
              <p>Due tomorrow</p>
              <p>Budi · PT ABC</p>
            </div>
          </div>

          {/* Step 3: Track */}
          <div
            className="rise rounded-2xl border border-border bg-background p-7"
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent">
              <CheckCircle2 className="size-5 text-accent-foreground" />
            </div>
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step 03
            </p>
            <h3 className="mt-2 text-[17px] font-semibold">Remembered</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              The commitment appears in your workspace. NANTI follows up so you don't have to.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  const items = [
    {
      num: "01",
      icon: Brain,
      title: "Remember",
      desc: "Never lose a promise again. NANTI catches commitments hiding inside ordinary conversation.",
    },
    {
      num: "02",
      icon: Zap,
      title: "Prioritize",
      desc: "Know what matters today, not just what's loudest. NANTI turns scattered conversations into one clear daily briefing.",
    },
    {
      num: "03",
      icon: Hourglass,
      title: "Follow Up",
      desc: "Know exactly who owes you what. Approvals, replies, payments, documents, decisions — all tracked, none forgotten.",
    },
    {
      num: "04",
      icon: ArrowRight,
      title: "Act",
      desc: "Close the loop. NANTI can draft the follow-up message for you to send — so replying takes seconds, not willpower.",
    },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid gap-x-12 gap-y-14 md:grid-cols-2">
          {items.map((item, i) => (
            <div key={item.num} className="rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-primary">{item.num}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-5 flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border">
                  <item.icon className="size-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiMemorySection() {
  return (
    <section className="border-y border-border bg-surface py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display-lg text-foreground">What am I forgetting?</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Ask NANTI anything about your work. It remembers every commitment, deadline, and
            follow-up — from every conversation you've forwarded it.
          </p>
        </div>

        <div className="mt-14 space-y-5">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-foreground px-5 py-3 text-[15px] text-background">
              What am I forgetting?
            </div>
          </div>

          {/* NANTI response */}
          <div className="rise rounded-2xl border border-border bg-background p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Logo showWord={false} />
              <span className="text-[14px] font-semibold">NANTI</span>
            </div>
            <p className="mt-4 text-[15.5px] leading-relaxed">
              I found 3 things that may need your attention.
            </p>
            <div className="mt-5 space-y-4">
              {[
                {
                  name: "Budi — PT ABC",
                  text: "You promised a revised quotation yesterday.",
                  icon: Clock,
                },
                { name: "Supplier China", text: "No response for 3 days.", icon: Hourglass },
                {
                  name: "Bali Villa",
                  text: "The team discussed a production issue but nobody appears assigned.",
                  icon: MessageSquareText,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                    <item.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-[13.5px] text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/app"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground"
            >
              Review all
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "For Business Owners",
              desc: "Your business runs through WhatsApp. NANTI keeps the commitments moving.",
              link: "/business",
            },
            {
              title: "For Professionals",
              desc: "Everything tracked. Nothing living rent-free in your head.",
              link: "/business",
            },
            {
              title: "For Personal",
              desc: "From work to family, remember what matters.",
              link: "/personal",
            },
          ].map((uc, i) => (
            <Link
              key={uc.title}
              to={uc.link}
              className="rise group rounded-2xl border border-border p-7 transition-shadow hover:shadow-lift"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <h3 className="text-[18px] font-semibold">{uc.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
                {uc.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary">
                Learn more
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
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
          <Brain className="size-7 text-primary" />
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
