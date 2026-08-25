import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  MessageSquareText,
  Brain,
  CheckCircle2,
  Camera,
  Clipboard,
} from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";

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
      <Insight />
      <CoreLoop />
      <Testimonial />
      <Integrations />
      <FinalCta />
    </MarketingLayout>
  );
}

/* ─── HERO ─── */

function Hero() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2400),
      setTimeout(() => setStep(3), 3800),
      setTimeout(() => setStep(0), 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative mx-auto max-w-[1200px] px-5 pt-24 pb-16 sm:px-8 sm:pt-32 sm:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-4 py-1.5">
                <span className="text-[12px] font-semibold text-[#25D366]">AI Memory for WhatsApp</span>
              </div>
            </Reveal>
            <Reveal delay={50}>
              <h1 className="display-hero text-[#111111]">
                You talk.
                <br />
                <span className="text-[#25D366]">NANTI</span> remembers.
              </h1>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-5 max-w-[440px] text-[16px] leading-[1.7] text-[#5F6368]">
                Your AI memory for the conversations that matter.
              </p>
            </Reveal>
            <Reveal delay={250}>
              <p className="mt-2 max-w-[460px] text-[14px] leading-[1.7] text-[#5F6368]">
                WhatsApp is where work and life happen. NANTI understands what you promised, who
                you&apos;re waiting for, and what needs to happen next.
              </p>
            </Reveal>
            <Reveal delay={350}>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row">
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all hover:bg-[#1fb85c] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)]"
                >
                  Try NANTI for free
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E7E9E7] px-6 py-3 text-[14px] font-medium text-[#111111] transition-all hover:bg-[#F7F8F6] hover:border-[#25D366]/30"
                >
                  See how it works
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative mx-auto w-[380px]">
              {/* WhatsApp bubble */}
              <div
                className={`rounded-2xl border border-[#E7E9E7] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-500 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#25D366]/10">
                    <MessageSquareText className="size-3.5 text-[#128C7E]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#111111]">Pak Tom 🏭</p>
                    <p className="text-[10px] text-[#5F6368]">14:32</p>
                  </div>
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-[#dcf8c6] px-4 py-2.5 text-[13px] text-[#303030]">
                  nanti saya kirim invoice tgl 28 agustus ya pak Tom
                </div>
              </div>

              {/* Forwarded pill */}
              <div
                className={`absolute -right-3 top-6 z-10 rounded-full border border-[#E7E9E7] bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#5F6368] shadow-sm backdrop-blur-sm transition-all duration-500 ${step >= 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"}`}
              >
                ↩ Forwarded to NANTI
              </div>

              {/* Extraction result */}
              <div
                className={`mt-3 rounded-2xl border border-[#E7E9E7] bg-[#111111] p-4 text-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all duration-500 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-md bg-[#25D366]">
                    <span className="text-[10px] font-bold text-white">N</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    🎯 Commitment detected
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "WHO", value: "Pak Tom 👤", delay: "0ms" },
                    { label: "WHAT", value: "Send invoice 📄", delay: "80ms" },
                    { label: "WHEN", value: "28 August 📅", delay: "160ms" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 ${step >= 2 ? "animate-extract-slide" : ""}`}
                      style={{ animationDelay: item.delay }}
                    >
                      <span className="text-[10px] font-bold text-[#25D366]">{item.label}</span>
                      <span className="text-[13px] text-white/90">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div
                  className={`mt-3 flex gap-2 ${step >= 3 ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                >
                  <span className="rounded-lg bg-[#25D366] px-3 py-1 text-[11px] font-semibold text-white">
                    ✅ Track
                  </span>
                  <span className="rounded-lg border border-white/20 px-3 py-1 text-[11px] font-medium text-white/60">
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

/* ─── INSIGHT ─── */

function Insight() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[700px] px-5 text-center sm:px-8">
        <Reveal>
          <div className="mb-4 text-[32px]">💭</div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
            Most of your commitments never become tasks.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-4 text-[15px] text-[#5F6368]">
            They live inside conversations. NANTI remembers them.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mx-auto mt-8 flex max-w-[480px] flex-col gap-2">
            {[
              { text: '"Besok saya kirim revisinya ya Pak."', emoji: "📋" },
              { text: '"Nanti saya follow up suppliernya."', emoji: "🔄" },
              { text: '"Saya kirim invoice tanggal 28."', emoji: "💰" },
            ].map((q, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#E7E9E7] bg-white px-4 py-2.5"
              >
                <span className="text-[16px]">{q.emoji}</span>
                <span className="text-[13px] text-[#111111]/70">{q.text}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-6 text-[16px] font-semibold text-[#111111]">
            You said it. <span className="text-[#25D366]">NANTI remembers it.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── CORE LOOP ─── */

function CoreLoop() {
  const steps = [
    { num: "01", emoji: "💬", label: "TALK", desc: "Your conversations already contain what needs to get done." },
    { num: "02", emoji: "🧠", label: "UNDERSTAND", desc: "NANTI finds the commitments hidden inside them." },
    { num: "03", emoji: "💾", label: "REMEMBER", desc: "NANTI keeps track of what you promised and who you're waiting for." },
    { num: "04", emoji: "🔔", label: "FOLLOW UP", desc: "When the time comes, NANTI brings it back to you." },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-[500px] text-center">
            <div className="mb-3 text-[28px]">⚡</div>
            <h2 className="text-[24px] font-bold tracking-tight text-[#111111] sm:text-[28px]">
              From conversation to action.
            </h2>
            <p className="mt-2 text-[14px] text-[#5F6368]">
              You don&apos;t create tasks. You just talk.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 80}>
              <div className="group rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-5 text-center transition-all hover:border-[#25D366]/30 hover:shadow-[0_4px_14px_rgba(37,211,102,0.1)]">
                <div className="text-[32px]">{s.emoji}</div>
                <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                  {s.label}
                </span>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[#5F6368]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Arrow connectors - desktop only */}
        <div className="mt-6 hidden justify-center gap-4 text-[20px] text-[#E7E9E7] lg:flex">
          <span>→</span><span>→</span><span>→</span>
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIAL ─── */

function Testimonial() {
  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[640px] px-5 text-center sm:px-8">
        <Reveal>
          <div className="mb-4 text-[28px]">⭐</div>
          <blockquote className="text-[18px] font-semibold leading-[1.5] text-[#111111] sm:text-[20px]">
            &ldquo;NANTI helped me stop losing promises in WhatsApp.&rdquo;
          </blockquote>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#25D366]/10 text-[14px] font-bold text-[#25D366]">
              T
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold text-[#111111]">Tom</p>
              <p className="text-[12px] text-[#5F6368]">Owner, PT Maju Jaya</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── INTEGRATIONS ─── */

function Integrations() {
  const items = [
    {
      name: "WhatsApp",
      emoji: "💬",
      color: "#25D366",
    },
    {
      name: "Google Calendar",
      emoji: "📅",
      color: "#4285F4",
    },
    {
      name: "Phone Widget",
      emoji: "📱",
      color: "#111111",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[640px] px-5 text-center sm:px-8">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5F6368]">
            Integrations
          </p>
          <p className="mt-3 text-[14px] text-[#5F6368]">
            Works with the tools you already use.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-8 flex justify-center gap-8">
            {items.map((item) => (
              <div
                key={item.name}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-5 transition-all hover:border-[#25D366]/30 hover:shadow-[0_4px_14px_rgba(37,211,102,0.1)]"
              >
                <div className="text-[32px]">{item.emoji}</div>
                <span className="text-[12px] font-medium text-[#5F6368]">{item.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#F7F8F6] py-16 sm:py-20">
      <div className="relative mx-auto max-w-[500px] px-5 text-center sm:px-8">
        <Reveal>
          <div className="mb-3 text-[28px]">🧠</div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
            Stop remembering everything.
          </h2>
          <p className="mt-3 text-[15px] text-[#5F6368]">
            Let NANTI remember what matters.
          </p>
          <Link
            to="/auth/signup"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all hover:bg-[#1fb85c] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)]"
          >
            Try NANTI for free
          </Link>
          <p className="mt-3 text-[12px] text-[#5F6368]">Start in minutes</p>
        </Reveal>
      </div>
    </section>
  );
}
