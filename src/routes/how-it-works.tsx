import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareText, Brain, CheckCircle2, Camera, Clipboard } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works · NANTI" },
      {
        name: "description",
        content:
          "Forward the message, or paste the conversation. NANTI reads it, and remembers what needs remembering.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <Steps />
      <Context />
      <BringAnything />
      <Cta />
    </MarketingLayout>
  );
}

/* ─── 3 STEPS ─── */

function Steps() {
  const steps = [
    {
      num: "01",
      emoji: "💬",
      title: "Bring a conversation",
      desc: "Forward, paste or upload a screenshot.",
    },
    {
      num: "02",
      emoji: "🧠",
      title: "NANTI understands it",
      desc: "It finds the people, commitments, dates and context.",
    },
    {
      num: "03",
      emoji: "🔔",
      title: "NANTI reminds you",
      desc: "When something matters, NANTI brings it back.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div className="relative mx-auto max-w-[800px] px-5 sm:px-8">
        <Reveal>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-4 py-1.5">
            <span className="text-[13px]">⚡</span>
            <span className="text-[12px] font-semibold text-[#25D366]">How it works</span>
          </div>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
            You don&apos;t create tasks. You just talk.
          </h1>
          <p className="mt-3 max-w-[480px] text-[15px] leading-[1.7] text-[#5F6368]">
            Forward the message, or paste the conversation. NANTI reads it, and remembers what
            needs remembering.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 100}>
              <div className="group rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-6 text-center transition-all hover:border-[#25D366]/30 hover:shadow-[0_4px_14px_rgba(37,211,102,0.1)]">
                <div className="text-[40px]">{s.emoji}</div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                  Step {s.num}
                </p>
                <h3 className="mt-1.5 text-[16px] font-semibold text-[#111111]">{s.title}</h3>
                <p className="mt-1.5 text-[13px] text-[#5F6368]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Arrow connectors */}
        <div className="mt-6 hidden justify-center gap-4 text-[20px] text-[#E7E9E7] sm:flex">
          <span>→</span><span>→</span>
        </div>
      </div>
    </section>
  );
}

/* ─── CONTEXT ─── */

function Context() {
  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[800px] px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <div className="mb-3 text-[28px]">🎯</div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#25D366]">
                Context
              </p>
              <h2 className="mt-3 text-[24px] font-bold tracking-tight text-[#111111]">
                It&apos;s not just a reminder.
              </h2>
              <p className="mt-3 text-[16px] font-semibold text-[#111111]">
                NANTI understands why.
              </p>
              <p className="mt-3 text-[14px] text-[#5F6368]">
                That&apos;s the difference between a reminder and memory.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-[#E7E9E7] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="mb-3 rounded-xl bg-[#F7F8F6] px-4 py-2.5 text-[13px] text-[#5F6368]">
                💬 &quot;Pak Tom, nanti saya kirim invoice tanggal 28 ya.&quot;
              </div>
              <div className="space-y-2">
                {[
                  { label: "WHO", value: "Pak Tom 👤", color: "text-[#25D366]" },
                  { label: "WHAT", value: "Invoice 📄", color: "text-[#25D366]" },
                  { label: "WHEN", value: "28 August 📅", color: "text-[#25D366]" },
                  { label: "WHY", value: "You promised to send it. 🤝", color: "text-[#25D366]" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg bg-[#F7F8F6] px-3 py-2">
                    <span className={`w-10 text-[10px] font-bold ${item.color}`}>{item.label}</span>
                    <span className="text-[13px] font-medium text-[#111111]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── BRING ANYTHING ─── */

function BringAnything() {
  const options = [
    { emoji: "💬", label: "WHATSAPP", desc: "Forward the conversation." },
    { emoji: "📸", label: "SCREENSHOT", desc: "Upload what you captured." },
    { emoji: "📋", label: "TEXT", desc: "Paste anything you want NANTI to remember." },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[700px] px-5 text-center sm:px-8">
        <Reveal>
          <div className="mb-3 text-[28px]">📦</div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
            Just bring it to NANTI.
          </h2>
          <p className="mt-2 text-[14px] text-[#5F6368]">
            Forward a conversation. Paste a message. Upload a screenshot.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {options.map((opt) => (
              <div
                key={opt.label}
                className="group rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-5 text-center transition-all hover:border-[#25D366]/30 hover:shadow-[0_4px_14px_rgba(37,211,102,0.1)]"
              >
                <div className="text-[32px]">{opt.emoji}</div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5F6368]">
                  {opt.label}
                </p>
                <p className="mt-1.5 text-[13px] text-[#5F6368]">{opt.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── CTA ─── */

function Cta() {
  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="relative mx-auto max-w-[500px] px-5 text-center sm:px-8">
        <Reveal>
          <div className="mb-3 text-[28px]">🚀</div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
            Ready to try it?
          </h2>
          <p className="mt-2 text-[14px] text-[#5F6368]">
            Paste your first conversation. See what NANTI catches. 👀
          </p>
          <Link
            to="/auth/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all hover:bg-[#1fb85c] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)]"
          >
            Get started
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
