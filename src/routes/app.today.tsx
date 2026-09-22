import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useNanti } from "@/lib/nanti-store";
import {
  formatDayHeadline,
  isDueToday,
  isOverdue,
  isUpcoming,
  waitingDays,
  jakartaHour,
} from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";
import { DashboardAssistant } from "@/components/nanti/dashboard-assistant";
import { generateFollowUpMessageServer } from "@/lib/nanti-ai.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Item } from "@/lib/nanti-types";

export const Route = createFileRoute("/app/today")({
  validateSearch: (search: Record<string, unknown>): { view?: "all" | undefined } => ({
    view: search["view"] === "all" ? "all" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Today · NANTI" },
      { name: "description", content: "Your tasks, conversations and follow-ups in one place." },
    ],
  }),
  component: Today,
});

export function Today() {
  const { items, settings, hydrated, personOf, projectOf, complete, snooze } = useNanti();
  const { view } = Route.useSearch();
  const [tab, setTab] = useState<"today" | "upcoming" | "undated">("today");
  const [pending, setPending] = useState<string | null>(null);
  const lock = useRef(false);
  const [draft, setDraft] = useState<{ title: string; text: string } | null>(null);
  const openDetail = useItemDetail();
  const tasks = items.filter((i) => i.status === "open" && i.kind !== "waiting");
  const today = tasks
    .filter((i) => isOverdue(i) || isDueToday(i))
    .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const upcoming = tasks
    .filter(isUpcoming)
    .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const undated = tasks.filter((i) => !i.due);
  const visible =
    view === "all"
      ? [...tasks].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
      : tab === "today"
        ? today
        : tab === "upcoming"
          ? upcoming
          : undated;
  const waiting = items
    .filter((i) => i.status === "open" && i.kind === "waiting")
    .sort((a, b) => waitingDays(b) - waitingDays(a));
  const inbox = items.filter((i) => i.status === "inbox");
  const overdue = tasks.filter(isOverdue).length;
  const action = async (item: Item, kind: "complete" | "snooze" | "draft") => {
    if (lock.current) return;
    lock.current = true;
    setPending(item.id);
    try {
      if (kind === "draft") {
        const tone =
          settings.tone === "loving" || settings.tone === "custom" ? "friendly" : settings.tone;
        const response = await generateFollowUpMessageServer({
          data: {
            personName: personOf(item.personId)?.name || item.personName || "",
            what: item.title,
            tone,
          },
        });
        setDraft({ title: item.title, text: response.message });
      } else if (kind === "complete" ? await complete(item.id) : await snooze(item.id, 1)) {
        toast.success(kind === "complete" ? "Marked complete" : "Postponed by one day");
      }
    } catch {
      toast.error("That action couldn’t be completed. Please try again.");
    } finally {
      lock.current = false;
      setPending(null);
    }
  };
  const hour = jakartaHour();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const rowButton =
    "min-h-11 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary disabled:opacity-40";
  if (!hydrated)
    return (
      <p role="status" className="py-12 text-muted-foreground">
        Loading your workspace…
      </p>
    );
  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {formatDayHeadline("en-GB")} · Jakarta time
          </p>
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl xl:text-5xl">
            {salutation}
            {settings.name ? `, ${settings.name}` : ""}.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Start with what needs your attention.
          </p>
        </div>
        <Link
          to="/app/import"
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-secondary"
        >
          Import a screenshot
        </Link>
      </header>
      <DashboardAssistant />
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div className="min-w-0">
          <section id="priorities" aria-labelledby="priorities-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="priorities-heading" className="font-serif text-2xl sm:text-3xl">
                {view === "all" ? "All tasks" : "Your priorities"}
              </h2>
              {overdue > 0 && (
                <p className="text-sm text-red-700 dark:text-red-300">{overdue} overdue</p>
              )}
            </div>
            <div
              className="mt-4 flex flex-wrap gap-2 border-b border-border pb-2"
              aria-label="Task filters"
            >
              {(
                [
                  ["today", "Today", today.length],
                  ["upcoming", "Upcoming", upcoming.length],
                  ["undated", "No date", undated.length],
                ] as const
              ).map(([value, label, count]) =>
                view === "all" ? null : (
                  <button
                    key={value}
                    aria-pressed={tab === value}
                    onClick={() => setTab(value)}
                    className={`min-h-11 border-b-2 px-3 text-sm ${tab === value ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {label} <span className="ml-1 text-xs">{count}</span>
                  </button>
                ),
              )}
              <Link
                to="/app/today"
                search={{ view: view === "all" ? undefined : "all" }}
                className="ml-auto inline-flex min-h-11 items-center px-2 text-sm underline underline-offset-4"
              >
                {view === "all" ? "Today’s priorities" : "All tasks"}
              </Link>
            </div>
            {visible.length === 0 ? (
              <div className="py-10">
                <p className="font-medium">
                  {tab === "today" && view !== "all" ? "Nothing due today." : "No tasks here yet."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tasks.length
                    ? "Check the other filters, or bring in a new conversation above."
                    : "Paste a conversation above to find your first tasks."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((item) => (
                  <li key={item.id} className="py-5">
                    <div className="flex items-start gap-3">
                      <button
                        disabled={pending !== null}
                        onClick={() => void action(item, "complete")}
                        aria-label={`Complete ${item.title}`}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-secondary disabled:opacity-40"
                      >
                        <span
                          aria-hidden="true"
                          className="size-5 rounded border border-muted-foreground"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => openDetail(item.id)}
                          className="min-h-11 text-left text-sm font-semibold leading-6 hover:underline sm:text-base"
                        >
                          {item.title}
                        </button>
                        <p className="break-words text-xs leading-6 text-muted-foreground">
                          {[
                            projectOf(item.projectId)?.name || item.projectName,
                            personOf(item.personId)?.name || item.personName,
                            item.source ||
                              (item.sourceType === "paste" ? "Pasted conversation" : "Saved task"),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <p
                            className={`text-xs ${isOverdue(item) ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}
                          >
                            {isOverdue(item) ? "Overdue · " : isDueToday(item) ? "Today · " : ""}
                            {item.due || "No deadline"}
                            {item.time ? ` · ${item.time}` : ""}
                          </p>
                          <div className="flex gap-2">
                            <button
                              disabled={pending !== null}
                              onClick={() => void action(item, "complete")}
                              className={rowButton}
                            >
                              {pending === item.id ? "Saving…" : "Done"}
                            </button>
                            <button
                              disabled={pending !== null}
                              onClick={() => void action(item, "snooze")}
                              className={rowButton}
                            >
                              Later
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section
            className="mt-9 border-t border-border pt-7"
            aria-labelledby="clarification-heading"
          >
            <h2 id="clarification-heading" className="font-serif text-2xl">
              Needs clarification
            </h2>
            {inbox.length ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {inbox.length} item{inbox.length === 1 ? "" : "s"} need your review before
                  tracking.
                </p>
                <ul className="mt-3 divide-y divide-border">
                  {inbox.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                      <p className="min-w-0 break-words text-sm">{item.title}</p>
                      <Link
                        to="/app/inbox"
                        className={rowButton + " inline-flex shrink-0 items-center"}
                      >
                        Review
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                You’re caught up. Unclear items from new conversations will appear here.
              </p>
            )}
          </section>
        </div>
        <aside className="min-w-0 border-t border-border pt-8 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
          <section aria-labelledby="waiting-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="waiting-heading" className="font-serif text-2xl sm:text-3xl">
                Waiting for
              </h2>
              <Link
                to="/app/waiting"
                className="inline-flex min-h-11 items-center text-xs underline underline-offset-4"
              >
                View all
              </Link>
            </div>
            {waiting.length ? (
              <ul className="divide-y divide-border">
                {waiting.slice(0, 5).map((item) => (
                  <li key={item.id} className="py-5">
                    <button
                      onClick={() => openDetail(item.id)}
                      className="min-h-11 text-left text-sm font-semibold hover:underline"
                    >
                      {item.title}
                    </button>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {personOf(item.personId)?.name || item.personName || "Awaiting a response"}
                      {item.since ? ` · ${waitingDays(item)} days` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        disabled={pending !== null}
                        onClick={() => void action(item, "draft")}
                        className={rowButton}
                      >
                        {pending === item.id ? "Working…" : "Draft follow-up"}
                      </button>
                      <button
                        disabled={pending !== null}
                        onClick={() => void action(item, "complete")}
                        className={rowButton}
                      >
                        Received
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-sm leading-6 text-muted-foreground">
                No outstanding replies. Items you’re waiting on will appear here.
              </p>
            )}
          </section>
          <section id="connections" className="mt-7 rounded-lg bg-secondary/60 p-5">
            <h2 className="text-base font-semibold">Connect your tools</h2>
            <dl className="mt-3 divide-y divide-border text-sm">
              <div className="flex flex-wrap justify-between gap-2 py-4">
                <dt>WhatsApp</dt>
                <dd className="text-xs text-muted-foreground">Coming soon</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-4">
                <dt>Google Calendar</dt>
                <dd className="text-xs text-muted-foreground">Coming soon</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Automatic delivery and calendar sync aren’t available yet. You can paste chats into
              NANTI now.
            </p>
            <Link
              to="/app/settings"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
            >
              Workspace settings
            </Link>
          </section>
        </aside>
      </div>
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review your follow-up</DialogTitle>
            <DialogDescription>
              This is a draft for {draft?.title}. Nothing has been sent.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="follow-up-draft" className="text-sm font-medium">
            Message
          </label>
          <textarea
            id="follow-up-draft"
            value={draft?.text || ""}
            onChange={(event) =>
              setDraft((current) => (current ? { ...current, text: event.target.value } : current))
            }
            rows={7}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm"
          />
          <button
            className="min-h-11 rounded-lg bg-primary px-4 text-sm text-primary-foreground"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(draft?.text || "");
                toast.success("Draft copied. Paste it into your conversation when ready.");
              } catch {
                toast.error("Copy is unavailable. Select the text and copy it manually.");
              }
            }}
          >
            Copy draft
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
