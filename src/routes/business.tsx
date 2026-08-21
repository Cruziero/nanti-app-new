import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Briefcase, TrendingUp } from "lucide-react";
import { MarketingLayout } from "@/components/nanti/marketing";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "For Business · NANTI" },
      { name: "description", content: "Your business runs through WhatsApp. NANTI keeps the commitments moving." },
    ],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent">
          <Building2 className="size-7 text-accent-foreground" />
        </div>
        <h1 className="display-lg mt-7 text-foreground">
          Your business runs through WhatsApp.
        </h1>
        <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-muted-foreground">
          NANTI keeps the commitments moving. Never lose track of a promise, a deadline, or a follow-up again.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {[
            { icon: Briefcase, title: "Sales & client management", desc: "Track every promise made to clients. Know what's overdue, what's waiting, and what needs your attention today." },
            { icon: TrendingUp, title: "Operations & projects", desc: "Keep production schedules, supplier follow-ups, and team commitments visible — all from your conversations." },
          ].map((item, i) => (
            <div key={item.title} className="rise rounded-2xl border border-border p-7" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-surface border border-border">
                <item.icon className="size-5 text-foreground" />
              </div>
              <h3 className="mt-4 text-[17px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <Link to="/welcome" className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background">
            Get started <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
