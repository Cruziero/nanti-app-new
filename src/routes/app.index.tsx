import { createFileRoute } from "@tanstack/react-router";
import { DashboardAssistant } from "@/components/nanti/dashboard-assistant";
import { PageHeader } from "@/components/nanti/app-shell";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Ask NANTI" },
      {
        name: "description",
        content: "Talk naturally with NANTI to remember, update, remind, and follow up.",
      },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Ask NANTI"
        subtitle="Your conversations can become memory, tasks, reminders, and follow-ups."
      />
      <DashboardAssistant />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Try: “Besok gue mesti kirim quotation jam 10”, “actually make that Friday”, or “I already followed up with Budi”.
      </p>
    </div>
  );
}
