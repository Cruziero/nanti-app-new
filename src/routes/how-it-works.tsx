import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Brain, CircleCheck as CheckCircle2, MessageSquareText } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works · NANTI" },
      {
        name: "description",
        content:
          "Paste or forward a WhatsApp conversation. NANTI AI finds commitments and tracks them for you.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-primary">How it works</p>
        <h1 className="display-lg mt-5 text-foreground">You don't create tasks. You just talk.</h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          Forward or paste your WhatsApp conversations. AI extracts commitments, deadlines, and
          follow-ups — no manual entry needed.
        </p>

        <div className="mt-16 space-y-8">
          {[
            {
              num: "01",
              icon: MessageSquareText,
              title: "Paste a conversation",
              desc: "Copy any WhatsApp chat — a group, a DM, a thread — and paste it into NANTI. You can also upload a .txt file or screenshot.",
            },
            {
              num: "02",
              icon: Brain,
              title: "NANTI reads and understands",
              desc: "Our AI identifies commitments, tasks, deadlines, follow-ups and items you're waiting for. It knows the difference between a real promise and small talk.",
            },
            {
              num: "03",
              icon: CheckCircle2,
              title: "Review and track",
              desc: "NANTI shows you what it found. You choose what to track. Everything lands in your workspace automatically.",
            },
          ].map((step, i) => (
            <div
              key={step.num}
              className="rise flex items-start gap-5 rounded-2xl border border-border p-7"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface border border-border">
                <step.icon className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                  {step.num}
                </p>
                <h3 className="mt-1.5 text-[19px] font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-primary/25 bg-accent/50 p-8 text-center">
          <h2 className="text-[24px] font-semibold tracking-tight">Ready to try it?</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Paste your first conversation and see what NANTI finds.
          </p>
          <Link
            to="/welcome"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
