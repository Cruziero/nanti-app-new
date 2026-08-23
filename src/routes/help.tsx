import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { MessageSquareText, Brain, Bell, Calendar, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center · NANTI" },
      { name: "description", content: "Get help with using NANTI." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    icon: MessageSquareText,
    q: "How do I forward a conversation to NANTI?",
    a: "Open any WhatsApp chat, select the messages you want, tap Forward, and choose NANTI as the destination. You can also copy-paste text directly into the Import page, or upload a screenshot.",
  },
  {
    icon: Brain,
    q: "What types of items does NANTI detect?",
    a: "NANTI detects five types: Commitments (promises you made), Tasks (things to do), Deadlines (date-bound items), Waiting (things others promised you), and Follow-ups (items that need a check-in).",
  },
  {
    icon: Bell,
    q: "How do reminders work?",
    a: "When NANTI detects a commitment with a due date, it sets a reminder. You can receive reminders via WhatsApp, push notification, Google Calendar, or in-app. Configure your channels in Settings.",
  },
  {
    icon: Calendar,
    q: "Can I connect Google Calendar?",
    a: "Yes. Go to Settings → Integrations → Google Calendar and click Connect. NANTI will sync your schedule and can create calendar events for detected deadlines.",
  },
  {
    icon: HelpCircle,
    q: "What is the difference between DO, WAIT, and FOLLOW UP?",
    a: "DO = your commitment to someone else. WAIT = someone else's commitment to you. FOLLOW UP = a gentle nudge when a response is overdue. NANTI categorizes these automatically.",
  },
];

function HelpPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Help Center</p>
        <h1 className="display-lg mt-5 text-foreground">How can we help?</h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          Everything you need to know about using NANTI.
        </p>

        <div className="mt-14 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-border bg-background p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-emerald-bg)]">
                  <faq.icon className="size-5 text-[var(--accent-emerald)]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold">{faq.q}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-surface p-8 text-center">
          <h2 className="text-[20px] font-semibold">Still need help?</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">Reach out to our support team.</p>
          <a
            href="mailto:support@nanti.app"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-[14px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Contact Support
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
