import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MessageSquareText,
  Shield,
  Eye,
  Trash2,
  Upload,
  Camera,
  Clipboard,
} from "lucide-react";
import { MarketingLayout, Reveal, useReveal } from "@/components/nanti/marketing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NANTI — You talk. NANTI remembers." },
      {
        name: "description",
        content:
          "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups — so you can stop carrying everything in your head.",
      },
      { property: "og:title", content: "NANTI — You talk. NANTI remembers." },
      {
        property: "og:description",
        content:
          "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups — so you can stop carrying everything in your head.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nanti-aja.vercel.app" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <Hero />
      <TheInsight />
      <CoreLoop />
      <ContextUnderstanding />
      <WhatNantiRemembers />
      <DailyExperience />
      <AskNanti />
      <BringAnything />
      <BuiltForHow />
      <WhatsAppInput />
      <Privacy />
      <SimpleExplanation />
      <SocialProof />
      <PricingSection />
      <FaqSection />
      <FinalCta />
    </MarketingLayout>
  );
}

/* ───────────────────────────────────────────
   HERO
   ─────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-[1200px] px-5 pt-24 pb-20 sm:px-8 sm:pt-32 sm:pb-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal>
              <h1 className="display-hero text-[#111111]">
                You talk.
                <br />
                <span className="text-[#25D366]">NANTI</span> remembers.
              </h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 max-w-[460px] text-[17px] leading-[1.7] text-[#5F6368]">
                Your AI memory for the conversations that matter.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-3 max-w-[480px] text-[15px] leading-[1.7] text-[#5F6368]">
                WhatsApp is where work, business and life happen. NANTI understands what you
                promised, who you&apos;re waiting for, and what needs to happen next.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1fb85c]"
                >
                  Try NANTI for free
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E7E9E7] px-6 py-3.5 text-[15px] font-medium text-[#111111] transition-colors hover:bg-[#F7F8F6]"
                >
                  See how it works ↓
                </a>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <p className="mt-5 text-[13px] text-[#5F6368]">
                Built for the way people actually communicate.
              </p>
            </Reveal>
          </div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2800),
      setTimeout(() => setStep(3), 4400),
      setTimeout(() => setStep(4), 6000),
      setTimeout(() => setStep(0), 7600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  return (
    <div className="relative hidden lg:block">
      <div className="relative mx-auto w-[400px]">
        {/* WhatsApp chat bubble */}
        <div
          className={`rounded-2xl border border-[#E7E9E7] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-500 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#25D366]/10">
              <MessageSquareText className="size-4 text-[#128C7E]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111111]">Pak Tom — Supplier</p>
              <p className="text-[11px] text-[#5F6368]">Chat · 14:32</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="inline-block rounded-2xl rounded-tl-sm bg-[#dcf8c6] px-4 py-2.5 text-[13.5px] text-[#303030]">
              nanti saya kirim invoice
              <br />
              tgl 28 agustus ya pak Tom
            </div>
          </div>
          {step < 1 && (
            <div className="mt-3 flex gap-1">
              <span className="size-1.5 rounded-full bg-[#5F6368]/40 animate-typing-dot" />
              <span className="size-1.5 rounded-full bg-[#5F6368]/40 animate-typing-dot" style={{ animationDelay: "0.2s" }} />
              <span className="size-1.5 rounded-full bg-[#5F6368]/40 animate-typing-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          )}
        </div>

        {/* Forwarded pill */}
        <div
          className={`absolute -right-4 top-8 z-10 rounded-full border border-[#E7E9E7] bg-white/90 px-4 py-2 text-[12px] font-medium text-[#5F6368] shadow-sm backdrop-blur-sm transition-all duration-500 ${step >= 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"}`}
        >
          ↩ Forwarded to NANTI
        </div>

        {/* Extraction result */}
        <div
          className={`mt-4 rounded-2xl border border-[#E7E9E7] bg-[#111111] p-5 text-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all duration-500 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-[#25D366]">
              <span className="text-[11px] font-bold text-white">N</span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              NANTI detected a commitment
            </span>
          </div>
          <div className="space-y-2.5">
            <div className={`flex items-start gap-3 ${step >= 2 ? "animate-extract-slide" : ""}`} style={{ animationDelay: "0ms" }}>
              <span className="mt-0.5 text-[11px] font-bold text-[#25D366]">WHO</span>
              <span className="text-[14px] text-white/90">Pak Tom</span>
            </div>
            <div className={`flex items-start gap-3 ${step >= 2 ? "animate-extract-slide" : ""}`} style={{ animationDelay: "80ms" }}>
              <span className="mt-0.5 text-[11px] font-bold text-[#25D366]">WHAT</span>
              <span className="text-[14px] text-white/90">Send invoice</span>
            </div>
            <div className={`flex items-start gap-3 ${step >= 2 ? "animate-extract-slide" : ""}`} style={{ animationDelay: "160ms" }}>
              <span className="mt-0.5 text-[11px] font-bold text-[#25D366]">WHEN</span>
              <span className="text-[14px] text-white/90">28 August</span>
            </div>
          </div>
          <div className={`mt-4 flex gap-2 ${step >= 3 ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
            <span className="rounded-lg bg-[#25D366] px-3.5 py-1.5 text-[12px] font-semibold text-white">
              Track this
            </span>
            <span className="rounded-lg border border-white/20 px-3.5 py-1.5 text-[12px] font-medium text-white/60">
              Dismiss
            </span>
          </div>
        </div>

        <div
          className={`mt-4 text-center text-[13px] font-medium text-[#5F6368] transition-all duration-500 ${step >= 4 ? "opacity-100" : "opacity-0"}`}
        >
          Remember this?
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   THE INSIGHT
   ─────────────────────────────────────────── */

function TheInsight() {
  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[800px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="display-xl text-[#111111]">
            Most of your commitments
            <br className="hidden sm:block" /> never become tasks.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-5 text-[18px] text-[#5F6368]">They live inside conversations.</p>
        </Reveal>

        <Reveal delay={200}>
          <div className="mx-auto mt-14 max-w-[520px] space-y-4">
            {[
              '"Besok saya kirim revisinya ya Pak."',
              '"Nanti saya follow up suppliernya."',
              '"Saya kirim invoice tanggal 28."',
              '"Besok kita confirm lagi."',
            ].map((quote, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#E7E9E7] bg-white px-5 py-3 text-[15px] text-[#111111]/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {quote}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={400}>
          <p className="mt-14 text-[22px] font-semibold tracking-tight text-[#111111] sm:text-[28px]">
            You said it.
            <br />
            <span className="text-[#25D366]">NANTI remembers it.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   CORE LOOP — 4 steps
   ─────────────────────────────────────────── */

function CoreLoop() {
  const steps = [
    {
      num: "01",
      label: "TALK",
      title: "Talk",
      desc: "Your conversations already contain what needs to get done.",
    },
    {
      num: "02",
      label: "UNDERSTAND",
      title: "Understand",
      desc: "NANTI finds the commitments hidden inside them.",
    },
    {
      num: "03",
      label: "REMEMBER",
      title: "Remember",
      desc: "NANTI keeps track of what you promised, who you're waiting for and what's coming next.",
    },
    {
      num: "04",
      label: "FOLLOW UP",
      title: "Follow up",
      desc: "When the time comes, NANTI brings it back to you.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-[640px] text-center">
          <Reveal>
            <h2 className="display-lg text-[#111111]">From conversation to action.</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-4 text-[16px] text-[#5F6368]">
              You don&apos;t create tasks. You just talk.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 100}>
              <div className="relative">
                <div className="mb-4 text-[48px] font-bold text-[#E7E9E7]">{step.num}</div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                  {step.label}
                </p>
                <h3 className="mt-2 text-[20px] font-semibold text-[#111111]">{step.title}</h3>
                <p className="mt-2.5 text-[15px] leading-[1.65] text-[#5F6368]">{step.desc}</p>
                {i < 3 && (
                  <div className="absolute top-6 right-0 hidden text-[#E7E9E7] lg:block">→</div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   CONTEXT UNDERSTANDING
   ─────────────────────────────────────────── */

function ContextUnderstanding() {
  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                Context
              </p>
              <h2 className="mt-4 display-lg text-[#111111]">It&apos;s not just a reminder.</h2>
              <p className="mt-4 text-[18px] font-semibold text-[#111111]">
                NANTI understands why.
              </p>
              <p className="mt-4 text-[15px] leading-[1.7] text-[#5F6368]">
                That&apos;s the difference between a reminder and memory.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-[#E7E9E7] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="mb-4 rounded-xl bg-[#F7F8F6] px-4 py-3 text-[14px] text-[#5F6368]">
                &quot;Pak Tom, nanti saya kirim invoice tanggal 28 ya.&quot;
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-12 text-[11px] font-bold text-[#25D366]">WHO</span>
                  <span className="text-[14px] font-medium text-[#111111]">Pak Tom</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-[11px] font-bold text-[#25D366]">WHAT</span>
                  <span className="text-[14px] font-medium text-[#111111]">Invoice</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-[11px] font-bold text-[#25D366]">WHEN</span>
                  <span className="text-[14px] font-medium text-[#111111]">28 August</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-[11px] font-bold text-[#25D366]">WHY</span>
                  <span className="text-[14px] font-medium text-[#111111]">
                    You promised to send it.
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   WHAT NANTI REMEMBERS
   ─────────────────────────────────────────── */

function WhatNantiRemembers() {
  const features = [
    {
      title: "Commitments",
      desc: "Never lose track of something you said you'd do.",
      items: ["Send invoice", "Send quotation", "Confirm shipment", "Call client"],
    },
    {
      title: "Follow-ups",
      desc: "Know who you're waiting for.",
      items: ["Waiting for approval", "Waiting for payment", "Waiting for confirmation"],
    },
    {
      title: "Deadlines",
      desc: "Remember when it needs to happen.",
      items: ["Today", "Tomorrow", "28 August", "Next week"],
    },
    {
      title: "Context",
      desc: "Remember the conversation behind the task.",
      items: ["Original WhatsApp message", "Who said it", "Why it matters"],
    },
  ];

  return (
    <section className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-[640px] text-center">
            <h2 className="display-lg text-[#111111]">
              Remember the things
              <br className="hidden sm:block" /> you don&apos;t want to forget.
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-7">
                <h3 className="text-[20px] font-semibold text-[#111111]">{f.title}</h3>
                <p className="mt-2 text-[15px] text-[#5F6368]">{f.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-[#E7E9E7] bg-white px-3 py-1.5 text-[13px] text-[#5F6368]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   DAILY EXPERIENCE
   ─────────────────────────────────────────── */

function DailyExperience() {
  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                Daily
              </p>
              <h2 className="mt-4 display-lg text-[#111111]">Wake up knowing what matters.</h2>
              <p className="mt-4 text-[16px] leading-[1.7] text-[#5F6368]">
                NANTI turns everything it remembers into a simple view of what needs your attention.
              </p>
              <a
                href="/auth/signup"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#1fb85c]"
              >
                See NANTI in action <ArrowRight className="size-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-[#E7E9E7] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
                  Today
                </p>
                <p className="text-[13px] text-[#5F6368]">3 things need your attention</p>
              </div>
              <div className="space-y-3">
                {[
                  { text: "Send invoice to Pak Tom", tag: "Due today", color: "text-[#dc2626]" },
                  { text: "Follow up Budi", tag: "Waiting 3 days", color: "text-[#d97706]" },
                  { text: "Check inventory", tag: "Potentially forgotten", color: "text-[#5F6368]" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center justify-between rounded-xl border border-[#E7E9E7] px-4 py-3"
                  >
                    <span className="text-[14px] font-medium text-[#111111]">{item.text}</span>
                    <span className={`text-[12px] font-medium ${item.color}`}>{item.tag}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-[#E7E9E7] pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
                  NANTI AI Briefing
                </p>
                <p className="mt-1.5 text-[13px] text-[#5F6368]">
                  &quot;You have 1 overdue item and 2 people waiting for you.&quot;
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   ASK NANTI
   ─────────────────────────────────────────── */

function AskNanti() {
  const questions = [
    "What am I forgetting?",
    "Who am I waiting for?",
    "What did I promise this week?",
    "What is overdue?",
  ];

  return (
    <section className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
              Ask NANTI
            </p>
            <h2 className="mt-4 display-lg text-[#111111]">
              Your conversations, searchable by meaning.
            </h2>
            <p className="mt-4 text-[16px] text-[#5F6368]">Ask NANTI what you forgot.</p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#25D366]">
                <span className="text-[11px] font-bold text-white">N</span>
              </div>
              <span className="text-[13px] font-semibold text-[#111111]">Ask NANTI</span>
            </div>
            <div className="rounded-xl border border-[#E7E9E7] bg-white px-4 py-3 text-[14px] text-[#5F6368]">
              What am I forgetting?
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[#E7E9E7] bg-white p-4">
                <p className="text-[13px] text-[#5F6368]">
                  I found 3 things that may need your attention.
                </p>
              </div>
              {[
                { name: "Budi", detail: "You promised a revised quotation yesterday." },
                { name: "Supplier China", detail: "No response for 3 days." },
                { name: "Pak Tom", detail: "Invoice due tomorrow." },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-start gap-3 rounded-xl border border-[#E7E9E7] bg-white px-4 py-3"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[11px] font-bold text-[#25D366]">
                    {item.name[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">{item.name}</p>
                    <p className="text-[13px] text-[#5F6368]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {questions.map((q) => (
              <span
                key={q}
                className="rounded-full border border-[#E7E9E7] bg-white px-4 py-2 text-[13px] text-[#5F6368]"
              >
                &ldquo;{q}&rdquo;
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   BRING ANYTHING
   ─────────────────────────────────────────── */

function BringAnything() {
  const options = [
    { icon: MessageSquareText, label: "WHATSAPP", desc: "Forward the conversation." },
    { icon: Camera, label: "SCREENSHOT", desc: "Upload what you captured." },
    { icon: Clipboard, label: "TEXT", desc: "Paste anything you want NANTI to remember." },
  ];

  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="display-lg text-[#111111]">Just bring it to NANTI.</h2>
          <p className="mt-4 text-[16px] text-[#5F6368]">
            Forward a conversation. Paste a message. Upload a screenshot.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {options.map((opt) => (
              <div
                key={opt.label}
                className="rounded-2xl border border-[#E7E9E7] bg-white p-7 text-center"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#25D366]/10">
                  <opt.icon className="size-5 text-[#25D366]" />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#5F6368]">
                  {opt.label}
                </p>
                <p className="mt-2 text-[14px] text-[#5F6368]">{opt.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={300}>
          <Link
            to="/auth/signup"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1fb85c]"
          >
            Bring something to NANTI
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   BUILT FOR HOW PEOPLE ACTUALLY WORK
   ─────────────────────────────────────────── */

function BuiltForHow() {
  const useCases = [
    {
      label: "BUSINESS OWNERS",
      title: "Your business runs through WhatsApp.",
      items: ["Clients", "Orders", "Payments", "Suppliers", "Approvals", "Follow-ups"],
      link: "/business",
      linkText: "See NANTI for business",
    },
    {
      label: "PROFESSIONALS",
      title: "Keep track of everything without keeping everything in your head.",
      items: ["Sales", "Consultants", "Managers", "Freelancers", "Creators", "Teams"],
      link: "/business",
      linkText: "See NANTI for work",
    },
    {
      label: "PERSONAL",
      title: "From work to family, remember what matters.",
      items: ["Appointments", "Plans", "Promises", "Travel", "Family", "Everyday life"],
      link: "/personal",
      linkText: "See NANTI for personal",
    },
  ];

  return (
    <section className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-[640px] text-center">
            <h2 className="display-lg text-[#111111]">
              Work doesn&apos;t happen in task managers.
            </h2>
            <p className="mt-4 text-[16px] text-[#5F6368]">It happens in conversations.</p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {useCases.map((uc, i) => (
            <Reveal key={uc.label} delay={i * 100}>
              <div className="flex h-full flex-col rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                  {uc.label}
                </p>
                <h3 className="mt-3 text-[18px] font-semibold text-[#111111]">{uc.title}</h3>
                <div className="mt-4 flex flex-1 flex-wrap gap-2">
                  {uc.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-[#E7E9E7] bg-white px-3 py-1.5 text-[13px] text-[#5F6368]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <Link
                  to={uc.link}
                  className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#25D366]"
                >
                  {uc.linkText} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   WHATSAPP IS THE INPUT
   ─────────────────────────────────────────── */

function WhatsAppInput() {
  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <h2 className="display-lg text-[#111111]">
              Keep using WhatsApp the way you already do.
            </h2>
            <p className="mt-4 text-[16px] text-[#5F6368]">
              You don&apos;t need another place to manage your life.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            {[
              { emoji: "💬", label: "WhatsApp" },
              { emoji: "↓", label: "" },
              { emoji: "🧠", label: "NANTI" },
              { emoji: "↓", label: "" },
              { emoji: "💾", label: "Memory" },
              { emoji: "↓", label: "" },
              { emoji: "🔔", label: "Reminder" },
              { emoji: "↓", label: "" },
              { emoji: "✅", label: "Action" },
            ].map((step, i) =>
              step.label === "" ? (
                <span key={i} className="text-[20px] text-[#E7E9E7]">
                  {step.emoji}
                </span>
              ) : (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[28px]">{step.emoji}</span>
                  <span className="text-[12px] font-semibold text-[#5F6368]">{step.label}</span>
                </div>
              ),
            )}
          </div>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-14 text-center text-[16px] leading-[1.7] text-[#5F6368]">
            Your conversations stay where they belong.
            <br />
            NANTI simply makes sure the important parts don&apos;t disappear.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   PRIVACY
   ─────────────────────────────────────────── */

function Privacy() {
  const principles = [
    {
      icon: Shield,
      label: "PRIVATE",
      desc: "Your data is yours.",
    },
    {
      icon: Eye,
      label: "CONTROL",
      desc: "Choose what NANTI remembers.",
    },
    {
      icon: Trash2,
      label: "DELETE",
      desc: "Delete your memories whenever you want.",
    },
  ];

  return (
    <section className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <h2 className="display-lg text-[#111111]">Your conversations are yours.</h2>
            <p className="mt-4 text-[16px] text-[#5F6368]">
              NANTI is built to help you remember — not to take ownership of your conversations.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {principles.map((p) => (
              <div key={p.label} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#25D366]/10">
                  <p.icon className="size-5 text-[#25D366]" />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#5F6368]">
                  {p.label}
                </p>
                <p className="mt-2 text-[15px] text-[#111111]">{p.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   SIMPLE EXPLANATION
   ─────────────────────────────────────────── */

function SimpleExplanation() {
  const steps = [
    {
      num: "01",
      title: "Bring a conversation",
      desc: "Forward, paste or upload.",
    },
    {
      num: "02",
      title: "NANTI understands it",
      desc: "It finds the people, commitments, dates and context.",
    },
    {
      num: "03",
      title: "NANTI reminds you",
      desc: "When something matters, NANTI brings it back.",
    },
  ];

  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <h2 className="display-lg text-[#111111]">How NANTI works</h2>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-4 text-[48px] font-bold text-[#E7E9E7]">{s.num}</div>
                <h3 className="text-[18px] font-semibold text-[#111111]">{s.title}</h3>
                <p className="mt-2 text-[15px] text-[#5F6368]">{s.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-14 text-center">
            <Link
              to="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1fb85c]"
            >
              Try NANTI free <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   SOCIAL PROOF
   ─────────────────────────────────────────── */

function SocialProof() {
  const categories = [
    "Business owners",
    "Sales teams",
    "Freelancers",
    "Consultants",
    "Creators",
    "Professionals",
  ];

  return (
    <section className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="display-lg text-[#111111]">
            Built for people who live in WhatsApp.
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-[#E7E9E7] bg-[#F7F8F6] px-5 py-2.5 text-[14px] font-medium text-[#5F6368]"
              >
                {cat}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   PRICING
   ─────────────────────────────────────────── */

function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "Rp 0",
      period: "forever",
      desc: "Start using NANTI",
      features: ["Up to 50 tracked items", "AI conversation import", "Daily briefing", "1 workspace"],
      cta: "Get started",
      highlight: false,
    },
    {
      name: "Pro",
      price: "Coming soon",
      period: "",
      desc: "For professionals who live in WhatsApp.",
      features: [
        "Unlimited tracked items",
        "AI conversation import",
        "Daily briefing & end-of-day sweep",
        "Ask NANTI AI assistant",
        "People & project memory",
        "Priority AI processing",
      ],
      cta: "Coming soon",
      highlight: true,
    },
  ];

  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <h2 className="display-lg text-[#111111]">Start remembering for free.</h2>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 ${plan.highlight ? "border-[#25D366]/30 bg-white shadow-[0_4px_20px_rgba(37,211,102,0.08)]" : "border-[#E7E9E7] bg-white"}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#25D366] px-3 py-1 text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-[18px] font-semibold text-[#111111]">{plan.name}</h3>
                <p className="mt-1.5 text-[13.5px] text-[#5F6368]">{plan.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-[34px] font-bold tracking-tight text-[#111111]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-[14px] text-[#5F6368]">{plan.period}</span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px]">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#25D366]" />
                      <span className="text-[#5F6368]">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth/signup"
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-all ${plan.highlight ? "bg-[#25D366] text-white hover:bg-[#1fb85c]" : "border border-[#E7E9E7] text-[#111111] hover:bg-[#F7F8F6]"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   FAQ
   ─────────────────────────────────────────── */

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = [
    {
      q: "What is NANTI?",
      a: "NANTI is an AI memory for WhatsApp conversations. It understands what you promised, who you're waiting for, and what needs to happen next — then reminds you when it matters.",
    },
    {
      q: "How does NANTI work with WhatsApp?",
      a: "You forward a WhatsApp conversation, paste a message, or upload a screenshot to NANTI. NANTI reads it, extracts the commitments and context, and tracks them for you.",
    },
    {
      q: "Do I need to manually create reminders?",
      a: "No. NANTI automatically detects commitments, deadlines, and follow-ups from your conversations. You just talk — NANTI handles the rest.",
    },
    {
      q: "Can NANTI understand screenshots?",
      a: "Yes. You can upload a screenshot of a WhatsApp conversation and NANTI will extract the relevant information.",
    },
    {
      q: "Can I ask NANTI what I promised?",
      a: "Yes. You can ask NANTI questions like 'What did I promise this week?' or 'Who am I waiting for?' and it will search your memories to find the answer.",
    },
    {
      q: "Can NANTI remind me on WhatsApp?",
      a: "NANTI can send you reminders and follow-ups. The exact delivery method depends on your settings and the current integration.",
    },
    {
      q: "Can NANTI connect to Google Calendar?",
      a: "Yes. NANTI can sync deadlines and commitments to your Google Calendar so they appear alongside your other events.",
    },
    {
      q: "Is my data private?",
      a: "Your data is yours. NANTI only sees what you forward or paste — never your whole WhatsApp. Nothing is sold, nothing is shared, and everything is yours to delete.",
    },
    {
      q: "Can I delete my memories?",
      a: "Yes. You can delete any tracked item or all your data at any time.",
    },
    {
      q: "Who is NANTI for?",
      a: "NANTI is for anyone who uses WhatsApp for work or personal life and wants to make sure important commitments don't get lost in the scroll.",
    },
  ];

  return (
    <section className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-[720px] px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <h2 className="display-lg text-[#111111]">Frequently asked questions</h2>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-14 space-y-0">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-[#E7E9E7]">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-[15px] font-medium text-[#111111]">{faq.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-[#5F6368] transition-transform duration-200 ${openIdx === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openIdx === i && (
                  <div className="pb-5 text-[14px] leading-[1.7] text-[#5F6368]">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   FINAL CTA
   ─────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="bg-[#F7F8F6] py-28 sm:py-36">
      <div className="mx-auto max-w-[640px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="display-xl text-[#111111]">
            Stop remembering everything.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-4 text-[18px] text-[#111111]">
            Let NANTI remember what matters.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-3 text-[15px] text-[#5F6368]">
            Your conversations already contain your commitments.
            <br />
            NANTI makes sure they don&apos;t get lost.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <Link
            to="/auth/signup"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-7 py-4 text-[16px] font-semibold text-white transition-all hover:bg-[#1fb85c]"
          >
            Try NANTI for free <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-[13px] text-[#5F6368]">Start in minutes.</p>
        </Reveal>
      </div>
    </section>
  );
}
