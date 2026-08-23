import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { Brain } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · NANTI" },
      { name: "description", content: "About NANTI — your AI memory for WhatsApp." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-emerald-bg)]">
          <Brain className="size-7 text-[var(--accent-emerald)]" />
        </div>
        <h1 className="display-lg mt-8 text-center text-foreground">About NANTI</h1>

        <div className="mt-10 space-y-6 text-[16px] leading-relaxed text-muted-foreground">
          <p>
            NANTI was built because we kept losing important commitments in WhatsApp threads. A
            promise made in a group chat. A deadline mentioned in passing. A follow-up that nobody
            remembered.
          </p>
          <p>
            We believe your messaging app should work for you, not against you. NANTI reads the
            conversations you choose to share and turns them into trackable commitments, reminders,
            and follow-ups.
          </p>
          <p>
            Built by a small team based in Indonesia. We use WhatsApp for business every day, just
            like you.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
