import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  BellRing,
  BookmarkCheck,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  Forward,
  ListPlus,
  Lock,
  MessageCircle,
  NotebookPen,
  ScanText,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { canonical, OG_IMAGE_URL, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [canonical("/")],
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
      <IntegrationsSection />
      <PrivacySection />
      <FinalCta />
    </MarketingLayout>
  );
}

/* Shared tokens. Warm neutrals sit under the WhatsApp-adjacent green so the accent reads as the brand, not as one of five tints. */
const ink = "text-[#171c24]";
const muted = "text-[#4a4d52]";
const green = "text-[#075E54]";
const eyebrow = "mb-3 block text-[13px] font-semibold text-[#075E54]";

/* ─── HERO ─── */

type Answer = { who: string; text: string; when?: string };

const ANSWERS: Record<string, Answer> = {
  "What did I promise Pak Tom?": {
    who: "Pak Tom",
    text: "Send invoice by",
    when: "28 August, 10:00 AM",
  },
  "Follow-up supplier deadline": {
    who: "PT Maju Supplier",
    text: "Follow-up raw materials shipment promised by",
    when: "Friday 15:00",
  },
  "When is invoice due?": {
    who: "Invoice Dispatch",
    text: "28 August, 10:00 AM for Pak Tom. Reminder set for 09:00 AM.",
  },
};

const CHIPS: [string, string][] = [
  ["Promise Pak Tom?", "What did I promise Pak Tom?"],
  ["Supplier follow-up", "Follow-up supplier deadline"],
  ["Invoice deadline", "When is invoice due?"],
];

function findAnswer(query: string): Answer {
  const q = query.toLowerCase();
  const key = Object.keys(ANSWERS).find(
    (k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()),
  );
  const hit = key ? ANSWERS[key] : undefined;
  return hit
    ? hit
    : {
        who: `Result for "${query}"`,
        text: "1 active commitment found in WhatsApp archive. Scheduled for review.",
      };
}

function Hero() {
  const [tracked, setTracked] = useState(false);
  const [input, setInput] = useState("What did I promise Pak Tom?");
  const [query, setQuery] = useState(input);
  const answer = findAnswer(query);

  return (
    <section className="w-full bg-[#faf9f6] pt-24 pb-20 lg:pt-28 lg:pb-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mx-auto mb-14 max-w-4xl text-center">
          <Reveal>
            <p className="mb-6 text-[14px] font-semibold text-[#075E54]">
              Remembers your WhatsApp commitments
            </p>
          </Reveal>
          <Reveal delay={50}>
            <h1
              className={`font-serif text-[56px] font-normal leading-[1.08] tracking-[-0.03em] ${ink} max-sm:text-[38px] max-sm:leading-[44px]`}
            >
              You talk. <span className={`italic ${green}`}>NANTI remembers.</span>
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className={`mx-auto mt-6 max-w-xl text-[17px] leading-[1.65] ${muted}`}>
              Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and
              reminds you when it&apos;s time.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/welcome"
                className="inline-flex items-center justify-center rounded-full bg-[#107E71] px-8 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-[#107E71]/20 transition-colors hover:bg-[#0b5e54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#107E71]"
              >
                Try NANTI for free
              </Link>
              <Link
                to="/how-it-works"
                className={`inline-flex items-center justify-center rounded-full border border-[#d4d2cb] px-7 py-3.5 text-[15px] font-semibold ${ink} transition-colors hover:border-[#107E71]/50 hover:text-[#075E54]`}
              >
                See how it works
              </Link>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-4 text-[13px] text-[#5f6368]">
              No credit card required. Free forever.
            </p>
          </Reveal>
        </div>

        {/* Product demo: one story read left to right, top to bottom. Only the detected card is elevated, because it is the moment the product does its job. */}
        <div className="mx-auto max-w-[960px]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#e6e3dc] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f3ee] text-[14px] font-semibold text-[#075E54]">
                    PT
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[15px] font-semibold ${ink}`}>Pak Tom</span>
                      <BadgeCheck
                        className="h-4 w-4 text-[#067a3f]"
                        aria-label="Verified business"
                      />
                    </div>
                    <span className="text-[12px] text-[#5f6368]">WhatsApp Business</span>
                  </div>
                </div>
                <span className="text-[12px] text-[#5f6368]">14:32</span>
              </div>
              <div className="mb-3 rounded-lg bg-[#f1f7f3] p-3.5 text-left">
                <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#075E54]">
                  <Forward className="h-3.5 w-3.5" aria-hidden />
                  <span>Forwarded message</span>
                </div>
                <p className={`text-[15px] leading-snug ${ink}`}>
                  &ldquo;nanti saya kirim invoice tgl 28 agustus ya pak Tom&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 text-[12px] font-medium text-[#075E54]">
                <span>Forwarded to NANTI</span>
                <CheckCheck className="h-4 w-4 text-[#34b7f1]" aria-label="Delivered and read" />
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9e7e1] bg-white p-6 shadow-lg shadow-[#0b3b33]/[0.06]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-semibold text-[#0f5132]">
                {tracked ? (
                  <BookmarkCheck className="h-4 w-4" aria-hidden />
                ) : (
                  <ScanText className="h-4 w-4" aria-hidden />
                )}
                <span>{tracked ? "Saved to Ledger" : "Commitment detected"}</span>
              </div>
              <dl className="mb-5 divide-y divide-[#eceae4] text-left">
                {[
                  { label: "Who", value: "Pak Tom" },
                  { label: "What", value: "Send invoice" },
                  { label: "When", value: "28 August, 10:00 AM", accent: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between py-2.5">
                    <dt className="text-[13px] text-[#5f6368]">{row.label}</dt>
                    <dd
                      className={`flex items-center gap-1.5 text-[15px] font-semibold ${row.accent ? "text-[#075E54]" : ink}`}
                    >
                      {row.accent && <CalendarClock className="h-4 w-4" aria-hidden />}
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={() => setTracked(!tracked)}
                aria-pressed={tracked}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[15px] font-semibold text-white transition-colors ${
                  tracked ? "bg-[#075E54]" : "bg-[#107E71] hover:bg-[#075E54]"
                }`}
              >
                {tracked ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden /> Tracked in WhatsApp
                  </>
                ) : (
                  <>
                    <ListPlus className="h-4 w-4" aria-hidden /> Track commitment
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-[#e6e3dc] bg-white p-4 lg:col-span-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery(input);
                }}
                className="flex items-center rounded-lg border border-[#d4d2cb] bg-[#faf9f6] p-1.5 pl-3 focus-within:border-[#107E71] focus-within:ring-1 focus-within:ring-[#107E71]"
              >
                <Search className="h-4 w-4 shrink-0 text-[#5f6368]" aria-hidden />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label="Ask NANTI"
                  placeholder="Ask NANTI anything from your chats..."
                  className={`mx-2.5 w-full border-0 bg-transparent p-0 text-[14px] ${ink} placeholder-[#5f6368] focus:outline-none`}
                />
                <button
                  type="submit"
                  aria-label="Ask"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#107E71] text-white transition-colors hover:bg-[#075E54]"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-[#5f6368]">Try:</span>
                {CHIPS.map(([label, q]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setInput(q);
                      setQuery(q);
                    }}
                    className={`rounded-md border border-[#e6e3dc] px-2.5 py-1 text-[12px] font-medium ${ink} transition-colors hover:border-[#107E71]/40 hover:text-[#075E54]`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 border-t border-[#eceae4] pt-3 text-left" aria-live="polite">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#075E54]">NANTI Answer</span>
                  <span className="text-[11px] text-[#5f6368]">WhatsApp Memory</span>
                </div>
                <p className={`text-[13px] leading-relaxed ${ink}`}>
                  {answer.who}: {answer.text}{" "}
                  {answer.when && (
                    <>
                      <strong className="text-[#107E71]">{answer.when}</strong> detected from
                      WhatsApp forwarded message.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl bg-[#0b3b33] p-5 text-white lg:col-span-2">
              <div className="mb-3 flex items-center gap-3">
                <BellRing className="h-5 w-5 text-[#8fd6b8]" aria-hidden />
                <div className="text-left">
                  <p className="text-[14px] font-semibold">Reminder from NANTI</p>
                  <p className="text-[12px] text-white/70">2 hours before deadline</p>
                </div>
              </div>
              <p className="mt-auto rounded-lg bg-white/10 p-3 text-left text-[14px] leading-snug">
                &ldquo;Invoice for Pak Tom is due at 10:00 AM today.&rdquo;
              </p>
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
    { text: "Besok saya kirim revisinya ya Pak.", detected: "Due tomorrow, 09:00" },
    { text: "Nanti saya follow up suppliernya.", detected: "Supplier follow-up" },
    { text: "Saya kirim invoice tanggal 28.", detected: "Invoice dispatch, 28th" },
  ];

  return (
    <section className="w-full bg-[#f2f0ea] py-20 lg:py-28" id="problem-section">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <Reveal>
            <span className={eyebrow}>The problem</span>
          </Reveal>
          <Reveal delay={50}>
            <h2
              className={`font-serif text-[40px] leading-[48px] tracking-[-0.025em] ${ink} max-sm:text-[30px] max-sm:leading-[36px]`}
            >
              Most of your commitments{" "}
              <span className={`italic ${green}`}>never become tasks.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className={`mt-4 max-w-lg text-[17px] leading-[1.65] ${muted}`}>
              They live in scattered chat threads. You say it in passing, you promise in good faith.
              NANTI captures it and turns it into something trackable.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p className={`mt-8 font-serif text-[22px] italic ${green}`}>
              You said it. NANTI remembers it.
            </p>
          </Reveal>
        </div>

        {/* A chat thread, because that is where these promises actually live. */}
        <Reveal delay={100}>
          <ol className="space-y-4">
            {quotes.map((q) => (
              <li key={q.text} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p
                  className={`max-w-[320px] rounded-2xl rounded-tl-sm bg-white px-4 py-3 font-serif text-[19px] leading-snug ${ink}`}
                >
                  &ldquo;{q.text}&rdquo;
                </p>
                <ArrowRight
                  className="hidden h-4 w-4 shrink-0 text-[#107E71] sm:block"
                  aria-hidden
                />
                <p className="flex items-center gap-2 pl-1 text-[14px] sm:pl-0">
                  <span className="text-[#5f6368]">Detected</span>
                  <span className="font-semibold text-[#075E54]">{q.detected}</span>
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */

const STEPS: {
  label: string;
  title: string;
  desc: string;
  footer: string;
  Icon: LucideIcon;
  inspector: { title: string; desc: string };
}[] = [
  {
    label: "Talk",
    title: "Converse naturally",
    desc: "Your conversations already hold what needs to get done. Just forward a message to NANTI.",
    footer: "Forward or paste",
    Icon: Forward,
    inspector: {
      title: "Forward the message to NANTI",
      desc: "Swipe right on any message with a promise and forward it to the NANTI contact.",
    },
  },
  {
    label: "Understand",
    title: "Extract intent",
    desc: "NANTI finds commitments, who said what, and when it is due.",
    footer: "Finds people and dates",
    Icon: ScanText,
    inspector: {
      title: "NANTI reads the message",
      desc: "NANTI finds the person (Pak Tom), the action (Send invoice), and the deadline (28 August 10:00 AM).",
    },
  },
  {
    label: "Remember",
    title: "Maintain ledger",
    desc: "Track what you promised and what you are waiting for from others.",
    footer: "Recorded quietly",
    Icon: NotebookPen,
    inspector: {
      title: "NANTI records the commitment",
      desc: "Recorded into your timeline. No boards or task lists to manage.",
    },
  },
  {
    label: "Follow up",
    title: "Gentle surfacing",
    desc: "When the time comes, NANTI sends a reminder back in WhatsApp.",
    footer: "Reminder with context",
    Icon: BellRing,
    inspector: {
      title: "NANTI sends the reminder",
      desc: "Two hours before the deadline, NANTI sends a reminder: Invoice for Pak Tom is due at 10:00 AM today.",
    },
  },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  const step = STEPS[active] ?? STEPS[0]!;

  return (
    <section className="w-full bg-[#faf9f6] py-20 lg:py-28" id="how-it-works-section">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="mb-12 max-w-2xl">
          <Reveal>
            <span className={eyebrow}>How it works</span>
          </Reveal>
          <Reveal delay={50}>
            <h2
              className={`font-serif text-[40px] leading-[48px] tracking-[-0.025em] ${ink} max-sm:text-[30px] max-sm:leading-[36px]`}
            >
              From conversation <span className={`italic ${green}`}>to action.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className={`mt-4 text-[17px] ${muted}`}>
              You do not create project boards or categorize tickets. You simply converse.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <ol className="border-l border-[#dcd9d1]">
            {STEPS.map((s, i) => {
              const on = active === i;
              return (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    className={`-ml-px w-full border-l-2 py-5 pl-6 pr-2 text-left transition-colors ${
                      on ? "border-[#107E71]" : "border-transparent hover:border-[#107E71]/30"
                    }`}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-serif text-[15px] italic text-[#5f6368]">{i + 1}.</span>
                      <span className={`font-serif text-[22px] leading-[28px] ${on ? green : ink}`}>
                        {s.title}
                      </span>
                      <span className="ml-auto text-[13px] font-semibold text-[#107E71]">
                        {s.label}
                      </span>
                    </span>
                    <span className={`mt-2 block pl-7 text-[15px] leading-relaxed ${muted}`}>
                      {s.desc}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="lg:sticky lg:top-28 lg:self-start" aria-live="polite">
            <div className="rounded-2xl bg-[#0b3b33] p-8 text-white">
              <step.Icon className="mb-6 h-8 w-8 text-[#8fd6b8]" aria-hidden />
              <p className="text-[13px] font-semibold text-[#8fd6b8]">Step {active + 1} Preview</p>
              <h3 className="mt-2 font-serif text-[28px] leading-[34px]">{step.inspector.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-white/80">
                {step.inspector.desc}
              </p>
              <p className="mt-8 border-t border-white/15 pt-4 text-[13px] text-white/70">
                {step.footer}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start gap-3 border-t border-[#e6e3dc] pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className={`font-serif text-[28px] leading-[34px] tracking-[-0.02em] ${ink}`}>
              You do not create tasks. <span className={`italic ${green}`}>You just talk.</span>
            </h3>
            <p className={`mt-2 max-w-xl text-[15px] ${muted}`}>
              Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and
              reminds you when it matters.
            </p>
          </div>
          <Link
            to="/how-it-works"
            className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-[#107E71] hover:text-[#075E54]"
          >
            See how NANTI works <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── INTEGRATIONS ─── */

function IntegrationsSection() {
  const items: { name: string; Icon: LucideIcon; primary?: boolean }[] = [
    { name: "WhatsApp", Icon: MessageCircle, primary: true },
    { name: "Google Calendar", Icon: CalendarDays },
    { name: "Lockscreen & Home Widget", Icon: Smartphone },
  ];
  return (
    <section className="w-full border-y border-[#e6e3dc] bg-white py-12">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="block text-[13px] font-semibold text-[#075E54]">Integrations</span>
          <h3 className={`mt-1 font-serif text-[22px] leading-[28px] ${ink}`}>
            Works with the tools you already use
          </h3>
        </div>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {items.map(({ name, Icon, primary }) => (
            <li
              key={name}
              className={`flex items-center gap-2.5 text-[15px] ${primary ? "font-bold text-[#075E54]" : `font-semibold ${ink}`}`}
            >
              <Icon
                className={`h-5 w-5 ${primary ? "text-[#25D366]" : "text-[#5f6368]"}`}
                aria-hidden
              />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── PRIVACY ─── */

function PrivacySection() {
  const items: { Icon: LucideIcon; title: string; desc: string; footer: string }[] = [
    {
      Icon: Lock,
      title: "Encrypted in transit and at rest",
      desc: "Your data travels over HTTPS and is stored encrypted.",
      footer: "No ads or profiling",
    },
    {
      Icon: Trash2,
      title: "You control your data",
      desc: "Delete your data anytime from Settings. We never sell or share your information with third parties.",
      footer: "Delete anytime",
    },
    {
      Icon: ScanText,
      title: "We only extract what matters",
      desc: "NANTI finds commitments and deadlines in your messages. It does not use your conversations for advertising or profiling.",
      footer: "Commitment extraction only",
    },
  ];

  return (
    <section className="w-full bg-[#faf9f6] py-20 lg:py-28" id="privacy-section">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Reveal>
            <span className={eyebrow}>Privacy</span>
          </Reveal>
          <Reveal delay={50}>
            <h2
              className={`font-serif text-[40px] leading-[48px] tracking-[-0.025em] ${ink} max-sm:text-[30px] max-sm:leading-[36px]`}
            >
              Your conversations <span className={`italic ${green}`}>are safe with us.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className={`mt-4 text-[17px] ${muted}`}>
              Your data stays yours. No ads, no profiling, no selling to third parties.
            </p>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <ul className="divide-y divide-[#e6e3dc] border-y border-[#e6e3dc]">
            {items.map(({ Icon, title, desc, footer }) => (
              <li key={title} className="grid grid-cols-[auto_1fr] gap-x-5 py-6">
                <Icon className="mt-1 h-5 w-5 text-[#107E71]" aria-hidden />
                <div>
                  <h3 className={`font-serif text-[21px] leading-[28px] ${ink}`}>{title}</h3>
                  <p className={`mt-1.5 text-[15px] leading-relaxed ${muted}`}>{desc}</p>
                  <p className="mt-3 text-[13px] font-semibold text-[#075E54]">{footer}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */

function FinalCta() {
  return (
    <section className="w-full bg-[#0b3b33] py-24 text-white lg:py-32">
      <div className="mx-auto max-w-[800px] px-6 text-center">
        <Reveal>
          <span className="mb-4 block text-[13px] font-semibold text-[#8fd6b8]">Start here</span>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="font-serif text-[56px] leading-[1.12] tracking-[-0.03em] max-sm:text-[38px] max-sm:leading-[44px]">
            Stop remembering everything.
            <br className="hidden sm:inline" />
            <span className="italic text-[#8fd6b8]"> Let NANTI remember what matters.</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-lg text-[17px] text-white/80">
            So you can stop holding it all in your head.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <Link
            to="/welcome"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-white px-9 py-4 text-[15px] font-semibold text-[#0b3b33] transition-colors hover:bg-[#e7f3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Try NANTI for free
          </Link>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-6 flex items-center justify-center gap-2 text-[13px] text-white/70">
            <ShieldCheck className="h-4 w-4 text-[#8fd6b8]" aria-hidden />
            Encrypted · Private · No tracking
          </p>
        </Reveal>
      </div>
    </section>
  );
}
