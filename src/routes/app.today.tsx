import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Hourglass, Clock, AlertTriangle } from "lucide-react";
import { EmptyState, Section } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import {
  formatDayHeadline,
  greeting,
  isDueToday,
  isOverdue,
  isUpcoming,
  openItems,
  waitingDays,
} from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";

export const Route = createFileRoute("/app/today")({
  head: () => ({
    meta: [{ title: "Today - NANTI" }, { name: "description", content: "What matters right now." }],
  }),
  component: Today,
});

function Today() {
  const { items, settings, hydrated, personOf, complete, snooze } = useNanti();
  const navigate = useNavigate();
  const openDetail = useItemDetail();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (hydrated && !settings.onboarded) void navigate({ to: "/welcome" });
  }, [hydrated, settings.onboarded, navigate]);

  const overdue = useMemo(() => items.filter(isOverdue), [items]);
  const dueToday = useMemo(() => items.filter(isDueToday), [items]);
  const upcoming = useMemo(() => items.filter(isUpcoming), [items]);
  const waiting = useMemo(
    () =>
      openItems(items)
        .filter((i) => i.kind === "waiting")
        .sort((a, b) => waitingDays(b) - waitingDays(a)),
    [items],
  );
  const potentiallyForgotten = useMemo(
    () =>
      openItems(items).filter(
        (i) =>
          i.kind !== "waiting" &&
          !isOverdue(i) &&
          !isDueToday(i) &&
          !isUpcoming(i) &&
          i.since &&
          new Date().getTime() - new Date(i.since).getTime() > 3 * 86400000,
      ),
    [items],
  );

  const needsAttention = overdue.length + dueToday.filter((i) => i.kind === "commitment").length;

  return (
    <div>
      <div className="mb-8">
        <p className="text-[12px] font-medium text-muted-foreground">
          {hydrated ? formatDayHeadline() : "Today"}
        </p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight sm:text-[30px]">
          {hydrated ? greeting(settings.name) : "Hello."}
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Here&apos;s what matters today.</p>
      </div>

      {needsAttention > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border px-4 py-3">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          <p className="text-[13.5px] font-medium">
            {needsAttention} thing{needsAttention !== 1 && "s"} need
            {needsAttention === 1 && "s"} your attention
          </p>
        </div>
      )}

      {overdue.length > 0 && (
        <Section title="Overdue" count={overdue.length}>
          {overdue.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-1 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {personOf(item.personId)?.name ?? item.source}
                  {item.due && ` - Due ${item.due}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    complete(item.id);
                    toast.success("Done");
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    snooze(item.id, 1);
                    toast("Snoozed");
                  }}
                  className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  Remind later
                </button>
              </div>
            </div>
          ))}
        </Section>
      )}

      <Section title="Today" count={dueToday.length}>
        {dueToday.length ? (
          dueToday.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-1 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {personOf(item.personId)?.name ?? item.source}
                  {item.time && ` - ${item.time}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    complete(item.id);
                    toast.success("Done");
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    snooze(item.id, 1);
                    toast("Snoozed");
                  }}
                  className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  Remind later
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="Nothing due today." hint="Enjoy the breathing room." />
        )}
      </Section>

      {upcoming.length > 0 && (
        <Section title="Upcoming" count={upcoming.length}>
          {upcoming.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-1 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {personOf(item.personId)?.name ?? item.source}
                  {item.due && ` - ${item.due}`}
                </p>
              </div>
            </div>
          ))}
          {upcoming.length > 5 && (
            <div className="px-1 py-3">
              <Link
                to="/app/reminders"
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                See all upcoming <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </Section>
      )}

      {waiting.length > 0 && (
        <Section title="Waiting" count={waiting.length}>
          {waiting.slice(0, 4).map((item) => {
            const person = personOf(item.personId);
            return (
              <div key={item.id} className="flex items-center gap-3 px-1 py-3">
                <Hourglass className="size-3.5 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">
                    {person?.name ?? item.source}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {item.title} - Waiting {waitingDays(item)} days
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground/50">{waitingDays(item)}d</span>
              </div>
            );
          })}
          {waiting.length > 4 && (
            <div className="px-1 py-3">
              <Link
                to="/app/waiting"
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                See all waiting <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </Section>
      )}

      {potentiallyForgotten.length > 0 && !dismissed && (
        <Section title="Potentially forgotten" count={potentiallyForgotten.length}>
          {potentiallyForgotten.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-1 py-3">
              <Clock className="size-3.5 shrink-0 text-muted-foreground/60" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {item.since
                    ? `Mentioned ${Math.floor((Date.now() - new Date(item.since).getTime()) / 86400000)} days ago`
                    : "May be forgotten"}
                </p>
              </div>
              <button
                onClick={() => openDetail(item.id)}
                className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                Review
              </button>
            </div>
          ))}
          <div className="px-1 py-2">
            <button
              onClick={() => setDismissed(true)}
              className="text-[12px] text-muted-foreground/50 hover:text-muted-foreground"
            >
              Dismiss
            </button>
          </div>
        </Section>
      )}

      {(upcoming.length > 0 || waiting.length > 0) && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              This week
            </p>
            <p className="mt-1 text-[18px] font-semibold">{upcoming.length + dueToday.length}</p>
            <p className="text-[11px] text-muted-foreground">commitments</p>
          </div>
          <div className="rounded-lg border border-border px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Waiting
            </p>
            <p className="mt-1 text-[18px] font-semibold">{waiting.length}</p>
            <p className="text-[11px] text-muted-foreground">items</p>
          </div>
          <div className="rounded-lg border border-border px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Total
            </p>
            <p className="mt-1 text-[18px] font-semibold">{openItems(items).length}</p>
            <p className="text-[11px] text-muted-foreground">open</p>
          </div>
        </div>
      )}
    </div>
  );
}
