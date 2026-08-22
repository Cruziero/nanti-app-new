import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { MarketingLayout } from "@/components/nanti/marketing";

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
    desc: "For trying out NANTI with a few conversations.",
    features: ["Up to 50 tracked items", "AI conversation import", "Daily briefing", "1 workspace"],
    cta: "Get started",
    to: "/welcome" as const,
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
    to: "/welcome" as const,
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
    to: "/welcome" as const,
    highlight: false,
  },
];

function PricingPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-primary">Pricing</p>
          <h1 className="display-lg mt-5 text-foreground">
            Simple pricing for every kind of work.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
            Start free. Upgrade when NANTI becomes indispensable.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`rise relative flex flex-col rounded-2xl border p-7 ${plan.highlight ? "border-primary bg-accent/30 shadow-lift" : "border-border bg-background"}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-[18px] font-semibold">{plan.name}</h3>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground">{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[34px] font-bold tracking-tight">{plan.price}</span>
                <span className="text-[14px] text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px]">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={plan.to}
                className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-opacity ${plan.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border text-foreground hover:bg-surface"}`}
              >
                {plan.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
