import { createFileRoute } from "@tanstack/react-router";
import { SimpleAssistant } from "@/components/nanti/simple-assistant";
import { PageHeader } from "@/components/nanti/app-shell";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Ask NANTI · Your work memory" },
      {
        name: "description",
        content:
          "Tell NANTI what you need to remember, or ask about your tasks, people, reminders and follow-ups.",
      },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Ask NANTI" subtitle="Your work memory" />
      <SimpleAssistant />
    </div>
  );
}
