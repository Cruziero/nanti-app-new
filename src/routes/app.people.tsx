import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, openItems } from "@/lib/nanti-utils";

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
  const list = people.filter((p) => (p.name + p.org).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="People" subtitle="Your relationship memory" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or company..."
        className="mb-5"
      />
      {list.length === 0 ? (
        <EmptyState title="No matching people." />
      ) : (
        <div className="divide-y divide-border">
          {list.map((p) => {
            const mine = openItems(items).filter((i) => i.personId === p.id);
            const waiting = mine.filter((i) => i.kind === "waiting");
            const commitments = mine.filter((i) => i.kind !== "waiting");
            const expanded = openId === p.id;
            return (
              <div key={p.id}>
                <div className="flex items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold">
                    {p.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{p.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {p.org}
                      {p.role ? ` - ${p.role}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
                    <span>{commitments.length} open</span>
                    <span>{waiting.length} waiting</span>
                    <button
                      onClick={() => setOpenId(expanded ? null : p.id)}
                      className="text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      {expanded ? "Less" : "More"}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-1 border-l-2 border-border/50 py-2 pl-4">
                    {p.activity.map((a) => (
                      <div key={a.date} className="flex gap-3 text-[12.5px]">
                        <span className="w-16 shrink-0 text-muted-foreground/60">
                          {formatDate(a.date).slice(0, 8)}
                        </span>
                        <span className="text-muted-foreground">{a.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
