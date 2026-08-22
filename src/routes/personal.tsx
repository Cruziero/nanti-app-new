import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Chrome as Home } from "lucide-react";
import { MarketingLayout } from "@/components/nanti/marketing";

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
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent">
          <Heart className="size-7 text-accent-foreground" />
        </div>
        <h1 className="display-lg mt-7 text-foreground">
          From work to family, remember what matters.
        </h1>
        <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-muted-foreground">
          NANTI isn't just for work. Birthday reminders, family commitments, household follow-ups —
          if it's in a conversation, NANTI remembers it.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {[
            {
              icon: Home,
              title: "Family commitments",
              desc: "Promises to your partner, your kids, your parents. NANTI catches them all.",
            },
            {
              icon: Heart,
              title: "Personal follow-ups",
              desc: "That restaurant recommendation, that book someone mentioned, that appointment you need to book.",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="rise rounded-2xl border border-border p-7"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-surface border border-border">
                <item.icon className="size-5 text-foreground" />
              </div>
              <h3 className="mt-4 text-[17px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
