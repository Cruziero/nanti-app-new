import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Section } from "@/components/nanti/app-shell";
import { KindBadge } from "@/components/nanti/kind-badge";
import { useNanti } from "@/lib/nanti-store";
import { dueLabel } from "@/lib/nanti-utils";
import type { ItemKind } from "@/lib/nanti-types";

export const Route = createFileRoute("/app/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox - NANTI" },
      { name: "description", content: "Things NANTI found in your conversations." },
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

      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
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
        <Section count={list.length}>
          {list.map((item) => {
            const person = personOf(item.personId);
            const project = projectOf(item.projectId);
            return (
              <div key={item.id} className="flex items-start gap-3 px-1 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <KindBadge kind={item.kind} />
                    <p className="truncate text-[14px] font-medium">{item.title}</p>
                  </div>
                  {item.quote && (
                    <p className="mt-1.5 text-[12.5px] italic text-muted-foreground">
                      "{item.quote}"
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                    {person && (
                      <span>
                        {person.name} - {person.org}
                      </span>
                    )}
                    {project && <span>{project.name}</span>}
                    {item.kind !== "waiting" && item.due && <span>{dueLabel(item)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      track(item.id);
                      toast.success("Tracked");
                    }}
                    className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    Track
                  </button>
                  <button
                    onClick={() => {
                      ignore(item.id);
                      toast("Ignored");
                    }}
                    className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            );
          })}
        </Section>
      )}
    </div>
  );
}
