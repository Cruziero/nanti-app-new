import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { TriangleAlert as AlertTriangle, Hourglass } from "lucide-react";
import { EmptyState, PageHeader, Section } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, openItems, waitingDays } from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";

export const Route = createFileRoute("/app/waiting")({
  head: () => ({
    meta: [
      { title: "Waiting - NANTI" },
      { name: "description", content: "People and things you're waiting on." },
    ],
  }),
  component: WaitingPage,
});

function WaitingPage() {
  const { items, personOf, complete, snooze } = useNanti();
  const openDetail = useItemDetail();
  const list = openItems(items)
    .filter((i) => i.kind === "waiting")
    .sort((a, b) => waitingDays(b) - waitingDays(a));

  return (
    <div>
      <PageHeader title="Waiting" subtitle="Who are you waiting for?" />

      {list.length === 0 ? (
        <EmptyState title="No one is keeping you waiting." hint="Everyone has replied to you." />
      ) : (
        <Section count={list.length}>
          {list.map((item) => {
            const person = personOf(item.personId);
            const days = waitingDays(item);
            const stale = days >= 4;
            return (
              <div key={item.id} className="flex items-start gap-3 px-1 py-3">
                <Hourglass className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0 flex-1">
                  <button className="text-left" onClick={() => openDetail(item.id)}>
                    <p className="text-[14px] font-medium">
                      {person ? `${person.name} - ${person.org}` : item.source}
                    </p>
                  </button>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    Waiting for: {item.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground/60">
                    Since {formatDate(item.since)} - {days} days
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {stale && (
                    <span className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                      <AlertTriangle className="size-3" /> Stale
                    </span>
                  )}
                  <button
                    onClick={() => {
                      complete(item.id);
                      toast.success("Marked received");
                    }}
                    className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      snooze(item.id, 2);
                      toast("Snoozed 2 days");
                    }}
                    className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                  >
                    Snooze
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
