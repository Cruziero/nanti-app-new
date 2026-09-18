import { createFileRoute, Link } from "@tanstack/react-router";
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
      <Hero />
      <Workflow />
      <BringAnything />
      <Cta />
    </MarketingLayout>
  );
}

/* ─── HERO ─── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div className="relative mx-auto max-w-[800px] px-5 sm:px-8">
        <Reveal>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e7f7ef] px-4 py-1.5">
            <span className="text-[12px] font-semibold text-[#075E54]">How it works</span>
          </div>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight text-[#171c24] sm:text-[36px]">
            You do not create tasks. You just talk.
          </h1>
          <p className="mt-3 max-w-[480px] text-[15px] leading-[1.7] text-[#45474a]">
            Forward the message, or paste the conversation. NANTI reads it, and remembers what
            needs remembering.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── WORKFLOW ─── */

function Workflow() {
  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[800px] px-5 sm:px-8">
        <Reveal>
          <div className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#075E54]">
              The process
            </p>
            <h2 className="mt-3 text-[24px] font-bold tracking-tight text-[#171c24]">
              From WhatsApp to memory.
            </h2>
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={100}>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-[13px] font-bold text-white">
                1
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171c24]">
                  Forward, paste, or upload
                </h3>
                <p className="mt-1 text-[14px] text-[#45474a]">
                  Forward a WhatsApp message to NANTI. Paste a conversation. Upload a screenshot of
                  a chat. NANTI accepts all of them.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-[13px] font-bold text-white">
                2
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171c24]">
                  NANTI finds what matters
                </h3>
                <p className="mt-1 text-[14px] text-[#45474a]">
                  NANTI reads the conversation and pulls out the commitments, who made them, and
                  when they are due. It does not read your messages for any other purpose.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-[13px] font-bold text-white">
                3
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171c24]">
                  NANTI reminds you when it matters
                </h3>
                <p className="mt-1 text-[14px] text-[#45474a]">
                  When a deadline approaches, NANTI sends a reminder. You do not have to remember
                  anything. NANTI does it for you.
                </p>
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
    { label: "WhatsApp", desc: "Forward the conversation to NANTI's WhatsApp contact." },
    { label: "Screenshot", desc: "Upload a photo of a chat. NANTI reads the text from the image." },
    { label: "Paste text", desc: "Copy and paste any conversation. NANTI handles the rest." },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[700px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="text-[24px] font-bold tracking-tight text-[#171c24]">
            Three ways to bring it in.
          </h2>
          <p className="mt-2 text-[14px] text-[#45474a]">
            Pick the one that fits your situation.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {options.map((opt) => (
              <div
                key={opt.label}
                className="rounded-lg border border-[#E7E9E7] bg-[#F7F8F6] p-5 text-left"
              >
                <p className="text-[14px] font-semibold text-[#171c24]">{opt.label}</p>
                <p className="mt-1.5 text-[13px] text-[#45474a]">{opt.desc}</p>
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
          <h2 className="text-[24px] font-bold tracking-tight text-[#171c24]">
            Ready to try it?
          </h2>
          <p className="mt-2 text-[14px] text-[#45474a]">
            Paste your first conversation. See what NANTI finds.
          </p>
          <Link
            to="/welcome"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#128C7E] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#0b5e54]"
          >
            Try NANTI for free
          </Link>
          <p className="mt-3 text-[12px] text-[#76777b]">No credit card required. Free forever.</p>
        </Reveal>
      </div>
    </section>
  );
}
