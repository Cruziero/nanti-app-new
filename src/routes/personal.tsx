import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "For Personal · NANTI" },
      { name: "description", content: "From work to family, remember what matters." },
    ],
  }),
  component: PersonalPage,
});

function PersonalPage() {
  return (
    <MarketingLayout>
      <Hero />
      <Features />
      <Examples />
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
            <span className="text-[12px] font-semibold text-[#25D366]">For Personal</span>
          </div>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
            Work isn&apos;t the only place you make promises.
          </h1>
          <p className="mt-4 max-w-[540px] text-[16px] leading-[1.7] text-[#5F6368]">
            NANTI also remembers the birthday you almost forgot, the thing you promised your kid,
            and the appointment your mom mentioned once. If it is in a conversation, NANTI
            remembers it.
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
      title: "Family commitments",
      desc: "Promises to your partner, your kids, your parents. NANTI remembers them.",
    },
    {
      title: "Personal follow-ups",
      desc: "That restaurant recommendation, that book someone mentioned, that appointment you need to book.",
    },
    {
      title: "Birthdays & events",
      desc: "When someone mentions a birthday or event in a conversation, NANTI remembers the date.",
    },
    {
      title: "Appointment tracking",
      desc: "Doctor visits, meetings, and gatherings. Every appointment mentioned becomes a tracked item.",
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
            Remember the things that matter.
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

/* ─── EXAMPLES ─── */

function Examples() {
  const examples = [
    {
      title: "\"Besok kita makan di tempat baru ya\"",
      desc: "NANTI remembers the dinner plan and reminds you tomorrow morning.",
    },
    {
      title: "\"Happy birthday ya, tgl 15\"",
      desc: "NANTI catches the birthday date and reminds you a day before.",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[800px] px-5 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold tracking-[0.02em] text-[#5F6368]">
            Examples
          </p>
          <h2 className="mt-3 text-[24px] font-bold tracking-tight text-[#111111]">
            What you mention becomes something you remember.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {examples.map((item, i) => (
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
            Try NANTI for your personal life.
          </h2>
          <p className="mt-2 text-[14px] text-[#5F6368]">
            Start remembering what matters from your conversations.
          </p>
          <Link
            to="/welcome"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#128C7E] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#0b5e54]"
          >
            Try NANTI for free
          </Link>
          <p className="mt-3 text-[12px] text-[#5F6368]">No credit card required. Free forever.</p>
        </Reveal>
      </div>
    </section>
  );
}
