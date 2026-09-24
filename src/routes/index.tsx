import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { OG_IMAGE_URL, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NANTI: You talk. NANTI remembers." },
      {
        name: "description",
        content:
          "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups so you stop carrying everything in your head.",
      },
      { property: "og:title", content: "NANTI: You talk. NANTI remembers." },
      {
        property: "og:description",
        content:
          "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NANTI: You talk. NANTI remembers." },
      {
        name: "twitter:description",
        content:
          "NANTI turns everyday WhatsApp conversations into commitments, reminders and follow-ups.",
      },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <CompactHowItWorks />
      <IntegrationsSection />
      <PrivacySection />
      <FinalCta />
    </MarketingLayout>
  );
}

/* ─── HERO ─── */

function Hero() {
  const [tracked, setTracked] = useState(false);
  const [query, setQuery] = useState("What did I promise Pak Tom?");

  const responses: Record<string, string> = {
    "What did I promise Pak Tom?":
      'Pak Tom: Send invoice by <strong className="text-[#128C7E]">28 August, 10:00 AM</strong> detected from WhatsApp forwarded message.',
    "Follow-up supplier deadline":
      "PT Maju Supplier: Follow-up raw materials shipment promised by <strong className=\"text-[#128C7E]\">Friday 15:00</strong>.",
    "When is invoice due?":
      "Invoice Dispatch: 28 August, 10:00 AM for Pak Tom. Reminder set for 09:00 AM.",
  };

  const runQuery = (q: string) => {
    setQuery(q);
  };

  const getResponse = () => {
    const key = Object.keys(responses).find(
      (k) =>
        k.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(k.toLowerCase()),
    );
    return key
      ? responses[key]
      : `Result for "${query}": 1 active commitment found in WhatsApp archive. Scheduled for review.`;
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#f9f9ff] pt-24 pb-20 lg:pt-28 lg:pb-28">
      <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/40 blur-[140px]" />
      <div className="pointer-events-none absolute right-10 top-1/3 -z-10 h-[300px] w-[300px] rounded-full bg-[#ffb199]/20 blur-[120px]" />

      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <Reveal>
            <p className="mb-6 text-[13px] font-semibold tracking-[0.02em] text-[#075E54]">
              Remembers your WhatsApp commitments
            </p>
          </Reveal>

          <Reveal delay={50}>
            <h1 className="font-serif text-[56px] font-normal leading-[1.08] tracking-[-0.03em] text-[#171c24] max-sm:text-[38px] max-sm:leading-[44px] max-sm:tracking-[-0.025em]">
              You talk.{" "}
              <span className="italic text-[#075E54] drop-shadow-sm">NANTI remembers.</span>
            </h1>
          </Reveal>

          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.65] text-[#45474a]">
              Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and
              reminds you when it&apos;s time.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/welcome"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#128C7E] px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#128C7E]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b5e54] hover:shadow-xl hover:shadow-[#128C7E]/40 active:translate-y-0"
              >
                Try NANTI for free
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c6c6ca] bg-transparent px-7 py-3.5 text-[15px] font-semibold text-[#171c24] shadow-sm transition-all duration-200 hover:border-[#128C7E]/50 hover:bg-[#f0f3ff] hover:text-[#075E54]"
              >
                See how it works
              </Link>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#76777b]">
              No credit card required. Free forever.
            </p>
          </Reveal>
        </div>

        {/* Product demo grid */}
        <div className="mx-auto max-w-[960px]">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left column: WhatsApp message */}
            <div className="animate-editorial-float-slow rounded-2xl border border-[#e5e8f4]/80 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#128C7E]/20 bg-[#e7f7ef] text-[14px] font-semibold text-[#075E54]">
                    PT
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-semibold text-[#171c24]">Pak Tom</span>
                      <span className="text-[14px] text-[#25D366]">&#10003;</span>
                    </div>
                    <span className="text-[12px] text-[#76777b]">WhatsApp Business</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#76777b]">14:32</span>
              </div>
              <div className="mb-3 rounded-r-lg border-l-4 border-[#128C7E] bg-[#f0f9f4] p-3.5 text-left">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#075E54]">
                  <span className="text-[14px] text-[#128C7E]">&#8618;</span>
                  <span>Forwarded message</span>
                </div>
                <p className="text-[14px] leading-snug text-[#171c24]">
                  &ldquo;nanti saya kirim invoice tgl 28 agustus ya pak Tom&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#075E54]">
                  <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                  <span>Forwarded to NANTI</span>
                </div>
                <span className="text-[16px] text-[#128C7E]">&#10003;&#10003;</span>
              </div>
            </div>

            {/* Right column: Commitment detected */}
            <div className="animate-editorial-float-delayed rounded-2xl border border-[#e5e8f4] bg-white p-6 shadow-2xl transition-all duration-300 hover:shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#128C7E]/20 bg-[#e8f8f2] px-3.5 py-1 text-[11px] font-semibold text-[#0f5132]">
                  <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                  <span>{tracked ? "Saved to Ledger" : "Commitment detected"}</span>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#128C7E] shadow-sm">
                  <span className="text-[13px] font-bold tracking-tighter text-white">N</span>
                </div>
              </div>
              <div className="mb-5 space-y-3 text-left">
                {[
                  { label: "WHO", value: "Pak Tom" },
                  { label: "WHAT", value: "Send invoice" },
                  { label: "WHEN", value: "28 August, 10:00 AM", accent: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between rounded bg-[#f0f3ff] px-3.5 py-2.5 transition-colors hover:bg-[#e5e8f4]"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#76777b]">
                      {row.label}
                    </span>
                    <span
                      className={`text-[15px] font-semibold ${row.accent ? "flex items-center gap-1 text-[#075E54]" : "text-[#171c24]"}`}
                    >
                      {row.accent && <span className="text-[16px]">&#128197;</span>}
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTracked(!tracked)}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-all duration-200 active:scale-95 ${
                  tracked
                    ? "bg-[#075E54] text-[#25D366] shadow-sm"
                    : "bg-[#128C7E] text-white shadow-sm hover:bg-[#075E54] hover:shadow-md"
                }`}
              >
                {tracked ? (
                  <span>&#10003; Tracked in WhatsApp</span>
                ) : (
                  <span>&#128203; Track commitment</span>
                )}
              </button>
            </div>
          </div>

          {/* Bottom row: search + reminder */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* Search bar: wider */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-[#128C7E]/25 bg-[#f0f9f4] p-4 shadow-md">
                <div className="flex items-center justify-between rounded-full border border-[#128C7E]/30 bg-white p-2 pl-4 shadow-sm transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#128C7E]">
                  <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
                    <span className="text-[20px] text-[#128C7E]">&#128269;</span>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && runQuery(query)}
                      placeholder="Ask NANTI anything from your chats..."
                      className="w-full border-0 bg-transparent p-0 text-[14px] text-[#171c24] placeholder-[#76777b] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => runQuery(query)}
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-white shadow-sm transition-all hover:scale-105 hover:bg-[#075E54] active:scale-95"
                  >
                    <span className="text-[16px]">&#8593;</span>
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#76777b]">Try:</span>
                  {["Promise Pak Tom?", "Supplier follow-up", "Invoice deadline"].map(
                    (chip, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          runQuery(
                            i === 0
                              ? "What did I promise Pak Tom?"
                              : i === 1
                                ? "Follow-up supplier deadline"
                                : "When is invoice due?",
                          )
                        }
                        className="rounded-full border border-[#c6c6ca]/40 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#171c24] transition-colors hover:bg-[#e7f7ef] hover:text-[#075E54]"
                      >
                        {chip}
                      </button>
                    ),
                  )}
                </div>
                <div className="mt-3 rounded-xl border border-[#128C7E]/20 bg-white p-3 shadow-sm text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#075E54]">
                      <span className="text-[15px] text-[#128C7E]">&#129302;</span>
                      <span>NANTI Answer</span>
                    </div>
                    <span className="text-[10px] text-[#76777b]">WhatsApp Memory</span>
                  </div>
                  <p
                    className="text-[12px] leading-relaxed text-[#171c24]"
                    dangerouslySetInnerHTML={{ __html: getResponse() }}
                  />
                </div>
              </div>
            </div>

            {/* Reminder card: narrower */}
            <div className="lg:col-span-2">
              <div className="animate-editorial-float-delayed flex h-full flex-col rounded-2xl border border-[#e5e8f4]/80 bg-white p-5 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-[14px] text-white">
                    &#128276;
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-semibold text-[#171c24]">Reminder from NANTI</p>
                    <p className="text-[11px] text-[#76777b]">2 hours before deadline</p>
                  </div>
                </div>
                <div className="flex-1 rounded-lg border border-[#128C7E]/15 bg-[#f0f9f4] p-3 text-left">
                  <p className="text-[13px] leading-snug text-[#171c24]">
                    &ldquo;Invoice for Pak Tom is due at 10:00 AM today.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── PROBLEM SECTION ─── */

function ProblemSection() {
  const quotes = [
    { text: "\u201cBesok saya kirim revisinya ya Pak.\u201d", detected: "Due tomorrow, 09:00" },
    { text: "\u201cNanti saya follow up suppliernya.\u201d", detected: "Supplier follow-up" },
    { text: "\u201cSaya kirim invoice tanggal 28.\u201d", detected: "Invoice dispatch, 28th" },
  ];

  return (
    <section className="w-full bg-[#eaedfa] py-20 lg:py-28" id="problem-section">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-14 max-w-2xl text-left">
          <Reveal>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.02em] text-[#075E54]">
              The problem
            </span>
          </Reveal>
          <Reveal delay={50}>
            <h2 className="font-serif text-[40px] leading-[48px] tracking-[-0.025em] text-[#171c24] max-sm:text-[30px] max-sm:leading-[36px] max-sm:tracking-[-0.02em]">
              Most of your commitments{" "}
              <span className="italic text-[#075E54]">never become tasks.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 text-[16px] leading-[1.65] text-[#45474a]">
              They live in scattered chat threads. You say it in passing, you promise in good faith.
              NANTI captures it and turns it into something trackable.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="group flex min-h-[220px] flex-col justify-between rounded-lg border border-[#e5e8f4]/60 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div>
                  <div className="mb-6 font-serif text-[22px] leading-[28px] tracking-[-0.015em] text-[#171c24] transition-colors group-hover:text-[#075E54]">
                    {q.text}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-full border border-[#128C7E]/20 bg-[#e8f8f2] px-4 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0f5132]">
                    Detected
                  </span>
                  <span className="text-[15px] font-semibold text-[#075E54]">{q.detected}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <p className="mt-12 text-center font-serif text-[22px] italic text-[#075E54]">
            You said it. NANTI remembers it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */

function HowItWorks() {
  const [active, setActive] = useState(0);

  const steps = [
    {
      num: "01",
      label: "TALK",
      title: "Converse naturally",
      desc: "Your conversations already hold what needs to get done. Just forward a message to NANTI.",
      footer: "Forward or paste",
      icon: "&#128172;",
      inspector: {
        badge: "Step 1 Preview",
        title: "Forward the message to NANTI",
        desc: "Swipe right on any message with a promise and forward it to the NANTI contact.",
        icon: "&#128172;",
      },
    },
    {
      num: "02",
      label: "UNDERSTAND",
      title: "Extract intent",
      desc: "NANTI finds commitments, who said what, and when it is due.",
      footer: "Finds people and dates",
      icon: "&#10024;",
      inspector: {
        badge: "Step 2 Preview",
        title: "NANTI reads the message",
        desc: "NANTI finds the person (Pak Tom), the action (Send invoice), and the deadline (28 August 10:00 AM).",
        icon: "&#10024;",
      },
    },
    {
      num: "03",
      label: "REMEMBER",
      title: "Maintain ledger",
      desc: "Track what you promised and what you are waiting for from others.",
      footer: "Recorded quietly",
      icon: "&#128220;",
      inspector: {
        badge: "Step 3 Preview",
        title: "NANTI records the commitment",
        desc: "Recorded into your timeline. No boards or task lists to manage.",
        icon: "&#128220;",
      },
    },
    {
      num: "04",
      label: "FOLLOW UP",
      title: "Gentle surfacing",
      desc: "When the time comes, NANTI sends a reminder back in WhatsApp.",
      footer: "Reminder with context",
      icon: "&#128276;",
      inspector: {
        badge: "Step 4 Preview",
        title: "NANTI sends the reminder",
        desc: "Two hours before the deadline, NANTI sends a reminder: Invoice for Pak Tom is due at 10:00 AM today.",
        icon: "&#128276;",
      },
    },
  ];

  return (
    <section className="w-full bg-[#f9f9ff] py-20 lg:py-28" id="how-it-works-section">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Reveal>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.02em] text-[#075E54]">
              How it works
            </span>
          </Reveal>
          <Reveal delay={50}>
            <h2 className="font-serif text-[40px] leading-[48px] tracking-[-0.025em] text-[#171c24] max-sm:text-[30px] max-sm:leading-[36px]">
              From conversation{" "}
              <span className="italic text-[#075E54]">to action.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 text-[16px] text-[#45474a]">
              You do not create project boards or categorize tickets. You simply converse.
            </p>
          </Reveal>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 80}>
              <button
                onClick={() => setActive(i)}
                className={`cursor-pointer flex h-full flex-col justify-between rounded-lg border-2 p-8 text-left shadow-sm transition-all duration-300 ${
                  active === i
                    ? "border-[#128C7E] bg-[#f0f9f4] shadow-md"
                    : "border-transparent bg-[#f0f3ff] hover:border-[#128C7E]/40 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#76777b]">
                      STEP {s.num}
                    </span>
                    <span className="text-[15px] font-bold text-[#128C7E]">{s.label}</span>
                  </div>
                  <h3 className="font-serif text-[22px] leading-[28px] text-[#171c24] mb-3">
                    {s.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#45474a]">{s.desc}</p>
                </div>
                <div
                  className={`mt-8 flex items-center gap-2 pt-4 ${active === i ? "text-[#075E54]" : "text-[#76777b]"}`}
                >
                  <span
                    className="text-[20px] text-[#128C7E]"
                    dangerouslySetInnerHTML={{ __html: s.icon }}
                  />
                  <span className="text-[11px] font-medium">{s.footer}</span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-xl border border-[#e5e8f4]/80 bg-[#f0f3ff] p-5 sm:flex-row sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#128C7E]/30 bg-[#e7f7ef] text-[#075E54]">
              <span
                className="text-[24px]"
                dangerouslySetInnerHTML={{ __html: steps[active].inspector.icon }}
              />
            </div>
            <div className="flex-1 text-left">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-[#128C7E] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {steps[active].inspector.badge}
                </span>
                <span className="text-[15px] font-semibold text-[#171c24]">
                  {steps[active].inspector.title}
                </span>
              </div>
              <p className="text-[12px] text-[#45474a]">{steps[active].inspector.desc}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#76777b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" /> Click cards above to
              view steps
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS (compact) ─── */

function CompactHowItWorks() {
  return (
    <section className="w-full bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="font-serif text-[32px] leading-[40px] tracking-[-0.025em] text-[#171c24] max-sm:text-[26px] max-sm:leading-[32px]">
              You do not create tasks.{" "}
              <span className="italic text-[#075E54]">You just talk.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 text-[16px] text-[#45474a]">
              Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and
              reminds you when it matters.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <Link
              to="/how-it-works"
              className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[#128C7E] hover:text-[#075E54]"
            >
              See how NANTI works
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── INTEGRATIONS ─── */

function IntegrationsSection() {
  return (
    <section className="w-full bg-[#eaedfa] py-16">
      <div className="mx-auto max-w-[1240px] px-6 text-center">
        <Reveal>
          <span className="mb-3 block text-[11px] font-semibold tracking-[0.02em] text-[#075E54]">
              Integrations
          </span>
          <h3 className="font-serif text-[22px] leading-[28px] text-[#171c24] mb-8">
            Works with the tools you already use
          </h3>
        </Reveal>
        <Reveal delay={100}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex cursor-pointer items-center gap-3 rounded-full border-2 border-[#128C7E] bg-[#e7f7ef] px-5 py-3 shadow-md shadow-[#128C7E]/10 transition-all hover:scale-105 hover:shadow-lg">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#128C7E]">
                <span className="text-[16px] text-white">&#128172;</span>
              </div>
              <span className="text-[15px] font-bold text-[#075E54]">WhatsApp</span>
            </div>
            <div className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[#c6c6ca]/50 bg-white px-5 py-3 shadow-sm transition-all hover:border-[#128C7E]/40 hover:shadow-md hover:scale-105">
              <span className="text-[20px] text-[#128C7E]">&#128197;</span>
              <span className="text-[15px] font-semibold text-[#171c24]">Google Calendar</span>
            </div>
            <div className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[#c6c6ca]/50 bg-white px-5 py-3 shadow-sm transition-all hover:border-[#128C7E]/40 hover:shadow-md hover:scale-105">
              <span className="text-[20px] text-[#128C7E]">&#128225;</span>
              <span className="text-[15px] font-semibold text-[#171c24]">
                Lockscreen &amp; Home Widget
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── PRIVACY ─── */

function PrivacySection() {
  const items = [
    {
      icon: "&#128274;",
      title: "Encrypted in transit and at rest",
      desc: "Your data travels over HTTPS and is stored encrypted.",
      footer: "No ads or profiling",
    },
    {
      icon: "&#128273;",
      title: "You control your data",
      desc: "Delete your data anytime from Settings. We never sell or share your information with third parties.",
      footer: "Delete anytime",
    },
    {
      icon: "&#128065;",
      title: "We only extract what matters",
      desc: "NANTI finds commitments and deadlines in your messages. It does not use your conversations for advertising or profiling.",
      footer: "Commitment extraction only",
    },
  ];

  return (
    <section className="w-full bg-[#f9f9ff] py-20 lg:py-28" id="privacy-section">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-16 max-w-2xl text-left">
          <Reveal>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.02em] text-[#075E54]">
              Privacy
            </span>
          </Reveal>
          <Reveal delay={50}>
            <h2 className="font-serif text-[40px] leading-[48px] tracking-[-0.025em] text-[#171c24] max-sm:text-[30px] max-sm:leading-[36px]">
              Your conversations{" "}
              <span className="italic text-[#075E54]">are safe with us.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 text-[16px] text-[#45474a]">
              Your data stays yours. No ads, no profiling, no selling to third parties.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="flex flex-col justify-between rounded-lg bg-[#f0f3ff] p-8 transition-shadow hover:shadow-md">
                <div>
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-[#128C7E]/20 bg-[#e7f7ef] text-[#075E54]">
                    <span className="text-[20px] text-[#128C7E]" dangerouslySetInnerHTML={{ __html: item.icon }} />
                  </div>
                  <h3 className="font-serif text-[22px] leading-[28px] text-[#171c24] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#45474a]">{item.desc}</p>
                </div>
                <span className="mt-8 text-[11px] font-semibold uppercase tracking-wider text-[#075E54]">
                  {item.footer}
                </span>
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
    <section className="w-full border-t border-[#128C7E]/15 bg-[#eef7f3] py-24 lg:py-32">
      <div className="mx-auto max-w-[800px] px-6 text-center">
        <Reveal>
          <span className="mb-4 block text-[11px] font-semibold tracking-[0.02em] text-[#075E54]">
              Start here
            </span>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="font-serif text-[56px] leading-[1.12] tracking-[-0.03em] text-[#171c24] max-sm:text-[38px] max-sm:leading-[44px]">
            Stop remembering everything.
            <br className="hidden sm:inline" />
            <span className="italic text-[#075E54]">
              {" "}
              Let NANTI remember what matters.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-lg text-[16px] text-[#45474a]">
            So you can stop holding it all in your head.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/welcome"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#128C7E] px-9 py-4 text-[15px] font-semibold text-white shadow-lg shadow-[#128C7E]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b5e54] hover:shadow-xl hover:shadow-[#128C7E]/40 active:translate-y-0"
            >
              Try NANTI for free
            </Link>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] font-semibold text-[#76777b]">
            <span className="flex items-center gap-1.5 text-[#075E54]">
              <span className="text-[15px] text-[#128C7E]">&#128737;</span> Encrypted
            </span>
            <span>&middot;</span>
            <span>Private</span>
            <span>&middot;</span>
            <span>No tracking</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
