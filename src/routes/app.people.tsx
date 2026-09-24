import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, isOverdue, openItems, waitingDays } from "@/lib/nanti-utils";

export const Route = createFileRoute("/app/people")({
  head: () => ({
    meta: [
      { title: "People - NANTI" },
      { name: "description", content: "Your relationship memory." },
    ],
  }),
  component: PeoplePage,
});

function PeoplePage() {
  const { people, items } = useNanti();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const search = q.trim().toLowerCase();
  const list = [...people]
    .filter((person) =>
      [person.name, person.org, person.role || ""]
        .join(" ")
        .toLowerCase()
        .includes(search),
    )
    .sort((a, b) =>
      String(b.lastConversation || "").localeCompare(String(a.lastConversation || "")),
    );

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="People NANTI remembers from your tasks, follow-ups, and conversations"
      />

      <div className="mb-5">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, company, or role..."
        />
        <p className="mt-2 text-[11.5px] leading-5 text-muted-foreground">
          Add or mention a person on a task and NANTI keeps that relationship connected to future work.
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={search ? "No matching people." : "No people remembered yet."}
          hint={
            search
              ? "Try another name, company, or role."
              : "Create a task with a person name, for example “Follow up Budi tomorrow”."
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {list.map((person) => {
            const related = openItems(items).filter((item) => item.personId === person.id);
            const waiting = related.filter((item) => item.kind === "waiting");
            const commitments = related.filter((item) => item.kind !== "waiting");
            const expanded = openId === person.id;

            return (
              <section key={person.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenId(expanded ? null : person.id)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold">
                    {person.name
                      .split(" ")
                      .map((word) => word[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{person.name}</p>
                    {(person.org || person.role) && (
                      <p className="truncate text-[12px] text-muted-foreground">
                        {[person.role, person.org].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                      Last interaction {formatDate(person.lastConversation)}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-3 text-[11.5px] text-muted-foreground sm:flex">
                    <span>{commitments.length} open</span>
                    <span>{waiting.length} waiting</span>
                    <span className="min-w-9 text-right text-muted-foreground/60">
                      {expanded ? "Less" : "More"}
                    </span>
                  </div>
                </button>

                {expanded && (
                  <div className="mb-4 ml-4 space-y-5 border-l-2 border-border/50 py-2 pl-5 sm:ml-12">
                    <div>
                      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                        Active work
                      </p>
                      {related.length ? (
                        <div className="space-y-2">
                          {related.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[12.5px] font-medium">{item.title}</p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  {item.kind === "waiting"
                                    ? `Waiting · ${waitingDays(item)} days`
                                    : item.due
                                      ? `${isOverdue(item) ? "Overdue" : "Due"} · ${formatDate(item.due)}`
                                      : "Open task"}
                                  {item.time ? ` · ${item.time}` : ""}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                                {item.kind === "waiting" ? "waiting" : item.kind}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-muted-foreground">
                          No active work with this person right now.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                        Relationship memory
                      </p>
                      {person.activity.length ? (
                        <div className="space-y-1.5">
                          {person.activity.slice(0, 20).map((activity, index) => (
                            <div
                              key={`${activity.date}-${index}-${activity.text}`}
                              className="flex gap-3 text-[12px]"
                            >
                              <span className="w-20 shrink-0 text-muted-foreground/60">
                                {formatDate(activity.date).slice(0, 10)}
                              </span>
                              <span className="text-muted-foreground">{activity.text}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-muted-foreground">
                          NANTI has identified this person, but no relationship activity has been recorded yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
