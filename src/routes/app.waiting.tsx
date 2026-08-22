import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { TriangleAlert as AlertTriangle } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/nanti/app-shell";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, openItems, waitingDays } from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";

export const Route = createFileRoute("/app/waiting")({
  head: () => ({
    meta: [
      { title: "Waiting · NANTI" },
      {
        name: "description",
        content: "People and things you're waiting on, with how long you've been waiting.",
      },
      { property: "og:title", content: "Waiting · NANTI" },
      { property: "og:description", content: "Don't let someone else's promise slip away." },
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

      <p className="mb-6 text-[14px] font-medium">{list.length} items waiting</p>

      {list.length === 0 ? (
        <EmptyState title="No one is keeping you waiting." hint="Everyone has replied to you." />
      ) : (
        <div className="space-y-3">
          {list.map((i, n) => {
            const person = personOf(i.personId);
            const days = waitingDays(i);
            const stale = days >= 4;
            return (
              <div
                key={i.id}
                style={{ animationDelay: `${n * 40}ms` }}
                className={
                  "rise card-soft p-5 " + (stale ? "border-warning/50 bg-warning/[0.06]" : "")
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <button className="min-w-0 text-left" onClick={() => openDetail(i.id)}>
                    <h3 className="text-[15.5px] font-semibold">
                      {person ? `${person.name} — ${person.org}` : i.source}
                    </h3>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                      Waiting for: {i.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      Since {formatDate(i.since)}
                    </p>
                  </button>
                  <div className="shrink-0 text-right">
                    <p
                      className={
                        "text-[22px] font-bold leading-none " +
                        (stale ? "text-warning-foreground" : "")
                      }
                    >
                      {days}
                    </p>
                    <p className="mt-1.5 text-[11.5px] text-muted-foreground">days</p>
                  </div>
                </div>
                {stale && (
                  <div className="mt-3 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-warning-foreground" />
                    <p className="text-[12.5px] font-medium text-warning-foreground">
                      This has been waiting unusually long. You should follow up directly.
                    </p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      toast.success(`Follow-up reminder created for ${person?.name ?? i.source}`)
                    }
                  >
                    Follow up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      complete(i.id);
                      toast.success("Marked received");
                    }}
                  >
                    Mark received
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      snooze(i.id, 2);
                      toast("Snoozed 2 days");
                    }}
                  >
                    Snooze
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
