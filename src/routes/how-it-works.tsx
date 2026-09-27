import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import {
  HonestBoundary,
  MarketingHero,
  ProductConversation,
  ProofRows,
  SimpleCta,
} from "@/components/nanti/marketing-proof";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How NANTI works · NANTI" },
      {
        name: "description",
        content:
          "Talk naturally, paste a conversation, or upload a screenshot. NANTI turns likely commitments, dates, people, and follow-ups into something you can track.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow="How it works"
        title={
          <>
            Tell NANTI what you mean.
            <br />
            <span className="text-[#0b6b5f]">It helps you keep track of it.</span>
          </>
        }
        description="Type naturally, even with typos. Ask NANTI to remember something, paste a conversation, or upload a screenshot. NANTI finds likely actions, dates, people, and follow-ups, then saves what is clear or asks when something important is missing."
        note="You do not need to write perfect task commands. NANTI is designed for everyday Indonesian, English, mixed language, shorthand, and messy chat."
      />

      <section className="bg-[#f7f9f7] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1040px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b6b5f]">
                One conversation
              </p>
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em] text-[#171c24] sm:text-[34px]">
                Ask, save, change, and finish work in the same place.
              </h2>
              <p className="mt-4 text-[14px] leading-7 text-[#5c6165]">
                NANTI is not a form you have to maintain. You can tell it what needs to happen,
                ask what you are forgetting, change the timing later, or mark something done in
                normal language.
              </p>
            </div>
          </Reveal>

          <ProductConversation
            label="Messy language is okay"
            userText="Saya beosok harus oulang dr puncak jam 10 pagi"
            assistantText="Got it. Pulang dari Puncak tomorrow at 10:00."
            saved="Saved to NANTI: Pulang dari Puncak"
            footer="NANTI normalizes obvious typos quietly. If a key detail is genuinely ambiguous, it asks instead of guessing."
          />
        </div>
      </section>

      <ProofRows
        eyebrow="The flow"
        title="From a conversation to something you can rely on."
        items={[
          {
            title: "1. Bring the context",
            description:
              "Type directly into Ask NANTI, paste a conversation, or upload a screenshot. Copying a WhatsApp chat into NANTI works today; direct WhatsApp forwarding is not required for the public app.",
          },
          {
            title: "2. NANTI interprets it",
            description:
              "It looks for what needs doing, who is involved, dates and times, projects, places, reminders, and things you are waiting to receive.",
          },
          {
            title: "3. Clear things get saved",
            description:
              "When the intent is clear, NANTI creates the task or Waiting item. When a key detail is unclear, it asks one short clarification instead of inventing an answer.",
          },
          {
            title: "4. Keep talking to update it",
            description:
              "Say things like “yang tadi Jumat aja”, “udah beres yang invoice”, or “ingatkan 30 menit sebelum”. NANTI can reschedule, complete, edit, and add reminders conversationally.",
          },
          {
            title: "5. Ask NANTI what needs attention",
            description:
              "Ask “What am I forgetting?”, “What should I do today?”, “Who should I follow up with?”, or “What’s overdue?” and NANTI answers from your saved workspace.",
          },
        ]}
      />

      <HonestBoundary
        items={[
          {
            label: "It does not turn every sentence into a task.",
            description:
              "Casual conversation and status updates should stay conversation. NANTI only saves a new item when there is a real action, commitment, deadline, waiting item, or reminder intent.",
          },
          {
            label: "It does not guess when two things could be right.",
            description:
              "If “Budi” could mean two different people or “the meeting” could refer to two tasks, NANTI should ask which one you mean.",
          },
          {
            label: "It learns useful language over time.",
            description:
              "You can teach aliases and preferences such as “Pak B itu Budi” or a usual reminder preference. Learned context stays tied to your account.",
          },
          {
            label: "The public workflow is web-first today.",
            description:
              "Ask NANTI, paste conversation, screenshot import, tasks, Waiting, and in-app reminders are the current reliable flow. Calendar, push, and direct WhatsApp integrations are being hardened separately before we promise them as day-one essentials.",
          },
        ]}
      />

      <SimpleCta
        title="Try NANTI with one real thing you need to remember."
        description="Use the way you normally type. NANTI should adapt to you, not the other way around."
      />
    </MarketingLayout>
  );
}
