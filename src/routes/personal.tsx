import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import {
  HonestBoundary,
  MarketingHero,
  ProductConversation,
  ProofRows,
  SimpleCta,
} from "@/components/nanti/marketing-proof";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "NANTI for Personal" },
      {
        name: "description",
        content:
          "A conversational second memory for appointments, errands, plans, reminders, and the little things you do not want to keep carrying in your head.",
      },
    ],
  }),
  component: PersonalPage,
});

function PersonalPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow="For personal life"
        title={
          <>
            A second memory for the things
            <br />
            <span className="text-[#0b6b5f]">you actually mean to do.</span>
          </>
        }
        description="Tell NANTI about an appointment, errand, plan, or reminder in the same language you would text a friend. NANTI can save it, remind you, and let you change it later without making you manage another complicated system."
        note="NANTI only remembers what you bring into your NANTI workspace. It does not silently read your private chats."
      />

      <section className="bg-[#f7f9f7] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1040px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b6b5f]">
                Type like yourself
              </p>
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em] text-[#171c24] sm:text-[34px]">
                You should not need perfect spelling to set a useful reminder.
              </h2>
              <p className="mt-4 text-[14px] leading-7 text-[#5c6165]">
                NANTI is built around messy everyday language: shorthand, typos, Indonesian,
                English, or both in the same message.
              </p>
            </div>
          </Reveal>

          <ProductConversation
            label="Personal plan"
            userText="besok jam 10 aku harus pulang dr puncak"
            assistantText="Got it — pulang dari Puncak tomorrow at 10:00."
            saved="Saved to NANTI: Pulang dari Puncak"
            footer="Later you can say “yang tadi jam 11 aja” or “udah beres” without rebuilding the task from scratch."
          />
        </div>
      </section>

      <ProofRows
        eyebrow="Everyday use"
        title="Useful when life happens in fragments."
        items={[
          {
            title: "Appointments",
            description:
              "Save a doctor visit, meeting, class, or appointment with the date and time you actually mentioned. Add or change the reminder later by talking to NANTI.",
          },
          {
            title: "Errands & plans",
            description:
              "Groceries, pickups, travel timing, things to bring, calls to make, and plans you do not want to keep rehearsing in your head.",
          },
          {
            title: "Things someone else owes you",
            description:
              "Use Waiting when you are expecting a document, reply, payment, reservation confirmation, or anything else from another person.",
          },
          {
            title: "Ask instead of search",
            description:
              "Ask “What am I forgetting?”, “What do I need to do today?”, or “What’s overdue?” and NANTI answers from your saved workspace.",
          },
          {
            title: "Your own language",
            description:
              "Teach useful aliases or preferences when needed. NANTI can remember that “Pak B” means Budi or that you prefer a certain reminder timing.",
          },
        ]}
      />

      <HonestBoundary
        title="NANTI remembers what you choose to bring in."
        items={[
          {
            label: "It does not read all of your private conversations.",
            description:
              "Type something into Ask NANTI, paste the relevant conversation, or upload a screenshot. That is the context NANTI works from.",
          },
          {
            label: "It does not save every casual mention.",
            description:
              "A birthday, restaurant, or plan only becomes something trackable when there is enough intent to save it — or when you explicitly ask NANTI to remember it.",
          },
          {
            label: "It can ask one clarification.",
            description:
              "If you say “remind me later” without enough context, NANTI should ask what or when rather than silently choosing the wrong thing.",
          },
          {
            label: "It is a memory layer, not a life feed.",
            description:
              "NANTI helps you keep selected commitments and reminders organized. It is not monitoring your phone, contacts, or conversations in the background.",
          },
        ]}
      />

      <SimpleCta
        title="Give NANTI one thing you do not want to carry in your head."
        description="Start with a real appointment, errand, follow-up, or plan. Use your normal language."
      />
    </MarketingLayout>
  );
}
