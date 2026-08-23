import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { Handshake } from "lucide-react";

export const Route = createFileRoute("/affiliates")({
  head: () => ({
    meta: [
      { title: "Affiliate Program · NANTI" },
      { name: "description", content: "Earn by sharing NANTI with others." },
    ],
  }),
  component: AffiliatesPage,
});

function AffiliatesPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Affiliate Program</p>
        <h1 className="display-lg mt-5 text-foreground">Share NANTI, earn together</h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          Know people who could use NANTI? Share your referral link and earn a commission for every
          paying customer you refer.
        </p>

        <div className="mt-14 space-y-6 text-[16px] leading-relaxed text-muted-foreground">
          <div className="rounded-2xl border border-border bg-background p-6">
            <h3 className="text-[16px] font-semibold text-foreground">How it works</h3>
            <p className="mt-2">
              Share your unique referral link. When someone signs up and subscribes through your
              link, you earn a commission on their subscription.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <h3 className="text-[16px] font-semibold text-foreground">Who can join</h3>
            <p className="mt-2">
              Anyone with an audience that could benefit from NANTI — content creators, consultants,
              business coaches, or simply happy users.
            </p>
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-emerald-bg)]">
            <Handshake className="size-7 text-[var(--accent-emerald)]" />
          </div>
          <h2 className="mt-6 text-[20px] font-semibold">Interested?</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Contact us to learn more about the program.
          </p>
          <a
            href="mailto:affiliates@nanti.app"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-[14px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Get in touch
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
