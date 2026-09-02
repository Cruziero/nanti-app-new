import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MessageSquareText, Shield, Lock, Eye, ChevronRight } from "lucide-react";
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
      { property: "og:image", content: "https://nanti-aja.vercel.app/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NANTI — You talk. NANTI remembers." },
      {
        name: "twitter:description",
        content:
          "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups.",
      },
      { name: "twitter:image", content: "https://nanti-aja.vercel.app/og-image.png" },
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
      <Privacy />
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
              <p className="mt-5 max-w-[480px] text-[16px] leading-[1.7] text-[#5F6368]">
                Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and reminds you when it&apos;s time.
              </p>
            </Reveal>
            <Reveal delay={250}>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row">
                <Link
                  to="/welcome"
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
            <Reveal delay={350}>
              <p className="mt-3 text-[12px] text-[#5F6368]">No credit card required. Free forever.</p>
            </Reveal>
          </div>

          {/* Desktop demo */}
          <div className="relative hidden lg:block">
            <DemoCard step={step} />
          </div>

          {/* Mobile demo - simplified */}
          <div className="relative lg:hidden">
            <DemoCard step={step} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoCard({ step }: { step: number }) {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      {/* WhatsApp bubble */}
      <div
        className={`rounded-2xl border border-[#E7E9E7] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-500 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-[#25D366]/10">
            <MessageSquareText className="size-3.5 text-[#128C7E]" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#111111]">Pak Tom</p>
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
        Forwarded to NANTI
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
            Commitment detected
          </span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "WHO", value: "Pak Tom", delay: "0ms" },
            { label: "WHAT", value: "Send invoice", delay: "80ms" },
            { label: "WHEN", value: "28 August", delay: "160ms" },
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
            Track
          </span>
          <span className="rounded-lg border border-white/20 px-3 py-1 text-[11px] font-medium text-white/60">
            Dismiss
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── INSIGHT ─── */

function Insight() {
  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[700px] px-5 text-center sm:px-8">
        <Reveal>
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
              { text: '"Besok saya kirim revisinya ya Pak."' },
              { text: '"Nanti saya follow up suppliernya."' },
              { text: '"Saya kirim invoice tanggal 28."' },
            ].map((q, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#E7E9E7] bg-white px-4 py-2.5"
              >
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
    { num: "01", label: "TALK", desc: "Your conversations already contain what needs to get done." },
    { num: "02", label: "UNDERSTAND", desc: "NANTI finds the commitments hidden inside them." },
    { num: "03", label: "REMEMBER", desc: "NANTI keeps track of what you promised and who you're waiting for." },
    { num: "04", label: "FOLLOW UP", desc: "When the time comes, NANTI brings it back to you." },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-[500px] text-center">
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
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                  Step {s.num}
                </span>
                <span className="mt-1 block text-[14px] font-bold text-[#111111]">
                  {s.label}
                </span>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[#5F6368]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
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
            {/* WhatsApp */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F7F8F6]">
                <svg className="size-7" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span className="text-[12px] font-medium text-[#5F6368]">WhatsApp</span>
            </div>
            {/* Google Calendar */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F7F8F6]">
                <svg className="size-7" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <span className="text-[12px] font-medium text-[#5F6368]">Google Calendar</span>
            </div>
            {/* Phone Widget */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F7F8F6]">
                <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <span className="text-[12px] font-medium text-[#5F6368]">Phone Widget</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── PRIVACY ─── */

function Privacy() {
  const items = [
    {
      icon: Shield,
      title: "End-to-end encrypted",
      desc: "Your messages are encrypted in transit and at rest. We never store raw conversation data.",
    },
    {
      icon: Lock,
      title: "You control your data",
      desc: "Delete your data anytime. We never sell or share your information with third parties.",
    },
    {
      icon: Eye,
      title: "AI reads patterns, not people",
      desc: "NANTI extracts commitments and deadlines. It never reads your messages for advertising or profiling.",
    },
  ];

  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5F6368]">
              Privacy & Security
            </p>
            <h2 className="mt-3 text-[24px] font-bold tracking-tight text-[#111111] sm:text-[28px]">
              Your conversations are safe with us.
            </h2>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="rounded-2xl border border-[#E7E9E7] bg-white p-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#25D366]/10">
                  <item.icon className="size-5 text-[#25D366]" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-[#111111]">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#5F6368]">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */

function FinalCta() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[500px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
            Stop remembering everything.
          </h2>
          <p className="mt-3 text-[15px] text-[#5F6368]">
            Let NANTI remember what matters.
          </p>
          <Link
            to="/welcome"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all hover:bg-[#1fb85c] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)]"
          >
            Try NANTI for free
          </Link>
          <p className="mt-3 text-[12px] text-[#5F6368]">No credit card required. Free forever.</p>
          <div className="mt-6 flex items-center justify-center gap-4 text-[12px] text-[#5F6368]">
            <span className="flex items-center gap-1"><Shield className="size-3" /> Encrypted</span>
            <span className="flex items-center gap-1"><Lock className="size-3" /> Private</span>
            <span className="flex items-center gap-1"><Eye className="size-3" /> No tracking</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
