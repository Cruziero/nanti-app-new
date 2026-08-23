import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { Briefcase } from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [{ title: "Careers · NANTI" }, { name: "description", content: "Join the NANTI team." }],
  }),
  component: CareersPage,
});

function CareersPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Careers</p>
        <h1 className="display-lg mt-5 text-foreground">Build with us</h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          We&apos;re building tools that help people remember what matters. If that sounds like
          something you&apos;d want to work on, we&apos;d love to hear from you.
        </p>

        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface border border-border">
            <Briefcase className="size-7 text-muted-foreground" />
          </div>
          <p className="mt-6 text-[18px] font-semibold">No open roles right now</p>
          <p className="mt-2 text-[15px] text-muted-foreground">
            But we&apos;re always interested in meeting talented people.
          </p>
          <a
            href="mailto:careers@nanti.app"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-[14px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Send your interest
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
