import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import {
  HonestBoundary,
  MarketingHero,
  ProductConversation,
  ProofRows,
  SimpleCta,
} from "@/components/nanti/marketing-proof";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "NANTI for Business" },
      {
        name: "description",
        content:
          "A personal operating memory for business owners and operators who manage client promises, supplier follow-ups, deadlines, and waiting items through chat.",
      },
    ],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow="For business"
        title={
          <>
            Your business does not need another board.
            <br />
            <span className="text-[#0b6b5f]">It needs fewer forgotten promises.</span>
          </>
        }
        description="NANTI helps business owners and operators turn chat-driven commitments into tasks, Waiting items, reminders, and follow-ups, then lets you manage them by talking naturally."
        note="Built for the person carrying the operational context today. NANTI is not yet a shared multi-user project-management suite or CRM."
      />

      <section className="bg-[#f7f9f7] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1040px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b6b5f]">
                A common business moment
              </p>
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em] text-[#171c24] sm:text-[34px]">
                Someone promises something in chat. You still have to remember it.
              </h2>
              <p className="mt-4 text-[14px] leading-7 text-[#5c6165]">
                Instead of moving the promise manually into another system, bring the message to
                NANTI and keep it in your operational memory.
              </p>
            </div>
          </Reveal>

          <ProductConversation
            label="Waiting / supplier follow-up"
            userText="Vendor bilang quotation dikirim besok, tolong catat gue nunggu"
            assistantText="Got it. I’ll keep the quotation under Waiting for Vendor."
            saved="Saved to NANTI: Waiting for vendor quotation"
            footer="Waiting items stay separate from your own tasks, so you can see what depends on someone else."
          />
        </div>
      </section>

      <ProofRows
        eyebrow="What it helps with"
        title="The small operational promises that usually fall between systems."
        items={[
          {
            title: "Client commitments",
            description:
              "Save the quotation, revision, invoice, proposal, or callback you promised, including the person and deadline when the conversation makes them clear.",
          },
          {
            title: "Supplier & vendor waiting",
            description:
              "Track what someone else promised to send or deliver. Waiting items stay visible until you mark them received or record another follow-up.",
          },
          {
            title: "Daily priorities",
            description:
              "Ask what is overdue, due today, or still waiting. NANTI answers from the tasks and follow-ups already saved in your workspace.",
          },
          {
            title: "Changes without admin work",
            description:
              "Reschedule, reprioritize, complete, delete, or set a reminder by talking to NANTI instead of opening and editing multiple task fields.",
          },
          {
            title: "People & project context",
            description:
              "NANTI can remember recurring people, project names, aliases, and recent context so phrases like “Pak B” or “proyek TPS” can become more useful over time when the match is clear.",
          },
        ]}
      />

      <HonestBoundary
        title="Useful for operations today. Not pretending to replace your whole stack."
        items={[
          {
            label: "Not a shared team workspace yet.",
            description:
              "NANTI currently works best as a personal operating memory for an owner, manager, or operator. It does not yet offer full multi-user assignment, permissions, or collaborative boards.",
          },
          {
            label: "Not a CRM or ERP replacement.",
            description:
              "Use NANTI to remember commitments and follow-ups around the systems you already use. It is not trying to become your customer database, accounting system, or inventory platform.",
          },
          {
            label: "Not every chat is saved automatically.",
            description:
              "The reliable public workflow today is to ask NANTI directly, paste a relevant conversation, or upload a screenshot and review what it found.",
          },
          {
            label: "Ambiguity is a reason to ask, not guess.",
            description:
              "If two clients, projects, or tasks could match the same phrase, NANTI should clarify before changing the wrong thing.",
          },
        ]}
      />

      <SimpleCta
        title="Use NANTI on the next promise you make in chat."
        description="Start with one quotation, supplier follow-up, invoice, or deadline. See whether NANTI keeps it visible without adding more admin work."
      />
    </MarketingLayout>
  );
}
