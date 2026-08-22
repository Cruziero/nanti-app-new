import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/nanti/app-shell";
import { KindBadge } from "@/components/nanti/kind-badge";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { dueLabel } from "@/lib/nanti-utils";
import type { ItemKind } from "@/lib/nanti-types";

export const Route = createFileRoute("/app/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox · NANTI" },
      {
        name: "description",
        content: "Things NANTI found in your WhatsApp conversations, ready to track.",
      },
      { property: "og:title", content: "Inbox · NANTI" },
      {
        property: "og:description",
        content: "Tasks, commitments, follow-ups and deadlines detected by AI.",
      },
    ],
  }),
  component: InboxPage,
});

const tabs: { id: "all" | ItemKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "commitment", label: "Commitments" },
  { id: "task", label: "Tasks" },
  { id: "followup", label: "Follow-ups" },
  { id: "deadline", label: "Deadlines" },
];

function InboxPage() {
  const { items, personOf, projectOf, track, ignore } = useNanti();
  const [tab, setTab] = useState<"all" | ItemKind>("all");
  const list = items.filter((i) => i.status === "inbox" && (tab === "all" || i.kind === tab));

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Things NANTI found in your conversations" />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
              (tab === t.id
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Inbox is clean."
          hint="Import a new conversation and NANTI will read it for you."
        />
      ) : (
        <div className="space-y-3">
          {list.map((i, n) => {
            const person = personOf(i.personId);
            const project = projectOf(i.projectId);
            return (
              <div
                key={i.id}
                style={{ animationDelay: `${n * 40}ms` }}
                className="rise card-soft p-5 transition-shadow hover:shadow-lift"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15.5px] font-semibold">{i.title}</h3>
                  <KindBadge kind={i.kind} />
                </div>
                <p className="mt-2.5 text-[14px] italic leading-relaxed text-muted-foreground">
                  "{i.quote}"
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Due</dt>
                    <dd className="font-medium">{i.kind === "waiting" ? "—" : dueLabel(i)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Person</dt>
                    <dd className="font-medium">
                      {person ? `${person.name} — ${person.org}` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Project</dt>
                    <dd className="font-medium">{project?.name ?? i.source}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      track(i.id);
                      toast.success("Tracked by NANTI");
                    }}
                  >
                    Track
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      ignore(i.id);
                      toast("Ignored");
                    }}
                  >
                    Ignore
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
