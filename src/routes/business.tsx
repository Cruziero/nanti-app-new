import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "For Business · NANTI" },
      {
        name: "description",
        content: "Your business runs through WhatsApp. NANTI keeps the commitments moving.",
      },
    ],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  return (
    <MarketingLayout>
      <Hero />
      <Features />
      <UseCases />
      <Cta />
    </MarketingLayout>
  );
}

/* ─── HERO ─── */

function Hero() {
  return (
    <section className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div className="mx-auto max-w-[800px] px-5 sm:px-8">
        <Reveal>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-4 py-1.5">
            <span className="text-[12px] font-semibold text-[#25D366]">For Business</span>
          </div>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
            Your business runs through WhatsApp.
          </h1>
          <p className="mt-4 max-w-[540px] text-[16px] leading-[1.7] text-[#5F6368]">
            NANTI tracks the quotation you owe a client, the sample a supplier promised, and the
            approval you are still waiting on.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── FEATURES ─── */

function Features() {
  const features = [
    {
      title: "Sales & client management",
      desc: "Every promise made to a client, tracked automatically. Know what's overdue, what's waiting, and what needs you today.",
    },
    {
      title: "Operations & projects",
      desc: "Production schedules, supplier follow-ups, and team commitments, all pulled straight from the conversations where they happened.",
    },
    {
      title: "Team coordination",
      desc: "When multiple people promise things in the same conversation, NANTI tracks who promised what to whom.",
    },
    {
      title: "Deadline tracking",
      desc: "Every date mentioned in a conversation becomes a tracked deadline.",
    },
  ];

  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[800px] px-5 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold tracking-[0.02em] text-[#5F6368]">
            Features
          </p>
          <h2 className="mt-3 text-[24px] font-bold tracking-tight text-[#111111]">
            Track what matters in your business.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="rounded-2xl border border-[#E7E9E7] bg-white p-6 transition-all hover:border-[#25D366]/30 hover:shadow-[0_4px_14px_rgba(37,211,102,0.1)]">
                <h3 className="text-[15px] font-semibold text-[#111111]">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#5F6368]">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── USE CASES ─── */

function UseCases() {
  const cases = [
    {
      title: "Quotation follow-ups",
      desc: "Client asked for a quotation? NANTI tracks when you promised to send it and reminds you before the deadline.",
    },
    {
      title: "Supplier coordination",
      desc: "Supplier promised delivery on Tuesday? NANTI remembers and follows up when the date arrives.",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[800px] px-5 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold tracking-[0.02em] text-[#5F6368]">
            Use cases
          </p>
          <h2 className="mt-3 text-[24px] font-bold tracking-tight text-[#111111]">
            Follow-ups that happen on time.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {cases.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-6">
                <h3 className="text-[15px] font-semibold text-[#111111]">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#5F6368]">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */

function Cta() {
  return (
    <section className="bg-[#F7F8F6] py-16 sm:py-20">
      <div className="mx-auto max-w-[500px] px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
            Ready to stop losing promises?
          </h2>
          <p className="mt-2 text-[14px] text-[#5F6368]">
            Start tracking commitments from your WhatsApp conversations.
          </p>
          <Link
            to="/welcome"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all hover:bg-[#1fb85c] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)]"
          >
            Try NANTI for free
          </Link>
          <p className="mt-3 text-[12px] text-[#5F6368]">No credit card required. Free forever.</p>
        </Reveal>
      </div>
    </section>
  );
}
