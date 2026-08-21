import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, openItems } from "@/lib/nanti-utils";

export const Route = createFileRoute("/app/people")({
  head: () => ({
    meta: [
      { title: "People · NANTI" },
      { name: "description", content: "Your relationship memory: your commitments, their commitments, and conversation history." },
      { property: "og:title", content: "People · NANTI" },
      { property: "og:description", content: "Remember who promised what, when." },
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
        className="mb-5 bg-surface"
      />
      {list.length === 0 ? (
        <EmptyState title="No matching people." />
      ) : (
        <div className="space-y-3">
          {list.map((p, n) => {
            const mine = openItems(items).filter((i) => i.personId === p.id);
            const waiting = mine.filter((i) => i.kind === "waiting");
            const commitments = mine.filter((i) => i.kind !== "waiting");
            const expanded = openId === p.id;
            return (
              <div key={p.id} style={{ animationDelay: `${n * 35}ms` }} className="rise card-soft p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[14px] font-semibold">
                    {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15.5px] font-semibold">{p.name}</h3>
                    <p className="text-[13px] text-muted-foreground">
                      {p.org}
                      {p.role ? ` · ${p.role}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
                      <span>Last conversation: {formatDate(p.lastConversation)}</span>
                      <span>Your commitments: {commitments.length}</span>
                      <span>Waiting from {p.name.split(" ")[0]}: {waiting.length}</span>
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className="rise mt-4 space-y-2 border-t border-border pt-4">
                    {p.activity.map((a) => (
                      <div key={a.date} className="flex gap-3 text-[13.5px]">
                        <span className="w-20 shrink-0 text-muted-foreground">{formatDate(a.date).slice(0, 8)}</span>
                        <span>{a.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpenId(expanded ? null : p.id)}>
                    {expanded ? "Hide history" : "View history"}
                  </Button>
                  <Button size="sm" onClick={() => toast.success(`Follow-up reminder created for ${p.name}`)}>
                    Follow up
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
