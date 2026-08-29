import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · NANTI" },
      { name: "description", content: "Simple pricing for NANTI — your AI memory for WhatsApp." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Free",
    price: "Rp 0",
    period: "forever",
    desc: "For trying NANTI with the conversations that matter most.",
    features: ["Up to 50 tracked items", "AI conversation import", "Daily briefing", "1 workspace"],
    cta: "Get started",
    to: "/auth/signup" as const,
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 149K",
    period: "/month",
    desc: "For professionals who live in WhatsApp.",
    features: [
      "Unlimited tracked items",
      "AI conversation import",
      "Daily briefing & end-of-day sweep",
      "Ask NANTI AI assistant",
      "People & project memory",
      "Priority AI processing",
    ],
    cta: "Get started",
    to: "/auth/signup" as const,
    highlight: true,
  },
  {
    name: "Business",
    price: "Custom",
    period: "",
    desc: "For teams that run on WhatsApp.",
    features: [
      "Everything in Pro",
      "Shared workspaces",
      "Team collaboration",
      "API access",
      "Custom AI training",
      "Dedicated support",
    ],
    cta: "Contact us",
    to: "/auth/signup" as const,
    highlight: false,
  },
];

function PricingPage() {
  return (
    <MarketingLayout>
      <section className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-[800px] px-5 text-center sm:px-8">
          <Reveal>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-4 py-1.5">
              <span className="text-[12px] font-semibold text-[#25D366]">Pricing</span>
            </div>
            <h1 className="mt-3 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
              Simple pricing for every kind of work.
            </h1>
            <p className="mt-3 text-[15px] text-[#5F6368]">
              Start free. Upgrade when NANTI becomes indispensable.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#F7F8F6] py-16 sm:py-20">
        <div className="mx-auto max-w-[1000px] px-5 sm:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all ${
                    plan.highlight
                      ? "border-[#25D366] bg-white shadow-[0_4px_20px_rgba(37,211,102,0.15)]"
                      : "border-[#E7E9E7] bg-white"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#25D366] px-3 py-1 text-[11px] font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-[18px] font-semibold text-[#111111]">{plan.name}</h3>
                  <p className="mt-1.5 text-[13px] text-[#5F6368]">{plan.desc}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-[32px] font-bold tracking-tight text-[#111111]">{plan.price}</span>
                    <span className="text-[14px] text-[#5F6368]">{plan.period}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px]">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#25D366]" />
                        <span className="text-[#5F6368]">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.to}
                    className={`mt-7 inline-flex items-center justify-center rounded-xl px-5 py-3 text-[14px] font-semibold transition-all ${
                      plan.highlight
                        ? "bg-[#25D366] text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:bg-[#1fb85c]"
                        : "border border-[#E7E9E7] text-[#111111] hover:bg-[#F7F8F6]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[500px] px-5 text-center sm:px-8">
          <Reveal>
            <p className="text-[14px] text-[#5F6368]">
              All plans include AI-powered extraction, daily briefings, and WhatsApp integration.
            </p>
            <p className="mt-2 text-[12px] text-[#5F6368]">
              No credit card required. Cancel anytime.
            </p>
          </Reveal>
        </div>
      </section>
    </MarketingLayout>
  );
}
