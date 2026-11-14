import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNanti } from "@/lib/nanti-store";
import {
  formatDayHeadline,
  isDueToday,
  isOverdue,
  isUpcoming,
  waitingDays,
  jakartaHour,
  todayISO,
  addDays,
  normalizeDay,
} from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";
import { generateFollowUpMessageServer } from "@/lib/nanti-ai.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Item } from "@/lib/nanti-types";
import { fetchDailyBriefing } from "@/lib/nanti-briefing.functions";
import { planDay } from "@/lib/nanti-planner";
import type { DayPlan } from "@/lib/nanti-planner";
import { Clock, RefreshCw } from "lucide-react";

type DailyBriefingView = {
  brief_date: string;
  greeting: string;
  summary: string;
  stats: {
    totalTasks?: number;
    dueToday?: number;
    overdue?: number;
    waiting?: number;
    waitingDue?: number;
    inbox?: number;
  };
  priorities: string[];
  waiting: string[];
  inbox: string[];
  generated_at: string;
};

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
  const { items, settings, hydrated, personOf, projectOf, complete, snooze, editItem } = useNanti();
  const { view } = Route.useSearch();
  const [tab, setTab] = useState<"day" | "upcoming" | "undated">("day");
  const [day, setDay] = useState(() => todayISO());
  const [pending, setPending] = useState<string | null>(null);
  const lock = useRef(false);
  const [draft, setDraft] = useState<{ title: string; text: string } | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefingView | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [applying, setApplying] = useState(false);
  const [planFailed, setPlanFailed] = useState(false);
  const openDetail = useItemDetail();

  const loadBriefing = useCallback(async (force = false) => {
    setBriefingLoading(true);
    try {
      const result = await fetchDailyBriefing({ data: { force } });
      setBriefing(result as DailyBriefingView);
    } catch (error) {
      console.error("Failed to load daily briefing:", error);
    } finally {
      setBriefingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void loadBriefing(false);
  }, [hydrated, loadBriefing]);
  const tasks = items.filter((i) => i.status === "open" && i.kind !== "waiting");
  const today = tasks
    .filter((i) => isOverdue(i) || isDueToday(i))
    .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const upcoming = tasks
    .filter(isUpcoming)
    .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const undated = tasks.filter((i) => !i.due);
  const todayDay = todayISO();
  const week = Array.from({ length: 7 }, (_, offset) => addDays(todayDay, offset));
  // Overdue tasks stay with today, so the first day of the strip never hides them.
  const dueOn = (iso: string) =>
    iso === todayDay ? today : tasks.filter((i) => normalizeDay(i.due) === iso);
  const dayTasks = dueOn(day);
  const dayName = (iso: string, weekday: "short" | "long") =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday, timeZone: "UTC" });
  const dayLabel = day === todayDay ? "Today" : `${dayName(day, "short")} ${Number(day.slice(8))}`;
  const visible =
    view === "all"
      ? [...tasks].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
      : tab === "day"
        ? dayTasks
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
  const buildPlan = () => {
    setPlanFailed(false);
    try {
      setPlan(
        planDay(
          tasks.map((item) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            kind: item.kind,
            due: item.due,
            time: item.time,
            priority: item.priority,
          })),
        ),
      );
    } catch (error) {
      console.error("Failed to build the day plan:", error);
      setPlanFailed(true);
      setPlan(null);
    }
  };

  const applyPlan = async () => {
    if (!plan || applying) return;
    setApplying(true);
    let written = 0;
    let failed = 0;
    try {
      for (const block of plan.blocks) {
        if (block.fixed) continue;
        const ok = await editItem(block.itemId, { time: block.start });
        if (ok) written += 1;
        else failed += 1;
      }
      setPlan(null);
      if (failed > 0) {
        toast.error(`${written} of ${written + failed} times saved. The rest need another try.`);
      } else {
        toast.success(
          written === 0
            ? "Your times were already in place."
            : `Day planned. ${written} time${written === 1 ? "" : "s"} saved.`,
        );
      }
    } catch (error) {
      console.error("Failed to apply the day plan:", error);
      toast.error("That plan couldn’t be saved. Please try again.");
    } finally {
      setApplying(false);
    }
  };
  const hour = jakartaHour();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const rowButton =
    "min-h-11 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary active:bg-secondary disabled:cursor-not-allowed disabled:opacity-40";
  const glance = [
    overdue > 0 && `${overdue} overdue`,
    waiting.length > 0 && `${waiting.length} waiting on others`,
    inbox.length > 0 && `${inbox.length} to clarify`,
  ].filter(Boolean);
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
          <p className="mb-2 text-sm text-muted-foreground">
            {formatDayHeadline("en-GB")} · Jakarta time
          </p>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">
            {salutation}
            {settings.name ? `, ${settings.name}` : ""}.
          </h1>
        </div>
        <Link
          to="/app/import"
          className="hidden min-h-11 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-secondary lg:inline-flex"
        >
          Import a screenshot
        </Link>
      </header>

      <section
        aria-label="Today at a glance"
        className="rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6"
      >
        <p className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">
          {today.length > 0
            ? `${today.length} task${today.length === 1 ? "" : "s"} for today`
            : "Your day is clear"}
        </p>
        <p className="mt-2 text-sm text-primary-foreground/90">
          {glance.length > 0 ? glance.join(" · ") : "Nothing overdue and nobody to chase."}
        </p>
        <a
          href="#priorities"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary-foreground px-4 text-sm font-semibold text-primary hover:opacity-90 active:opacity-80 focus-visible:outline-primary-foreground!"
        >
          See your tasks
        </a>
      </section>

      <section aria-label="Daily briefing" className="border-b border-border pb-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Daily briefing
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {briefing?.greeting || "Your daily brief"}
            </h2>
          </div>
          <button
            type="button"
            disabled={briefingLoading}
            onClick={() => void loadBriefing(true)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Refresh daily briefing"
          >
            <RefreshCw className={`size-4 ${briefingLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {briefingLoading && !briefing ? (
          <p className="mt-4 text-sm text-muted-foreground">NANTI is preparing your brief…</p>
        ) : briefing ? (
          <>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/90 sm:text-[15px]">
              {briefing.summary}
            </p>
            {briefing.priorities?.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Start here</p>
                <ol className="space-y-2">
                  {briefing.priorities.slice(0, 3).map((priority, index) => (
                    <li key={priority} className="flex gap-3 text-sm leading-6">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span>{priority}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {(briefing.waiting?.length > 0 || briefing.inbox?.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-3">
                {briefing.waiting?.length > 0 && (
                  <Link
                    to="/app/waiting"
                    className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-secondary"
                  >
                    {briefing.waiting.length} follow-up{briefing.waiting.length === 1 ? "" : "s"}
                  </Link>
                )}
                {briefing.inbox?.length > 0 && (
                  <Link
                    to="/app/inbox"
                    className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-secondary"
                  >
                    {briefing.inbox.length} clarification{briefing.inbox.length === 1 ? "" : "s"}
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Your brief will appear here when NANTI can reach your workspace memory.
          </p>
        )}
      </section>

      <section aria-labelledby="plan-heading" className="rounded-lg bg-secondary/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="plan-heading" className="text-base font-semibold">
              Auto-schedule your day
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Lay your open tasks across 09:00 to 18:00, keeping any times you already set. Nothing
              is written until you approve the plan.
            </p>
          </div>
          {!plan && tasks.length > 0 && (
            <button
              type="button"
              onClick={buildPlan}
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Plan my day
            </button>
          )}
        </div>

        {!plan && tasks.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing is open right now, so there is nothing to schedule.
          </p>
        )}

        {planFailed && (
          <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
            That plan couldn’t be built. Please try again.
          </p>
        )}

        {plan && plan.blocks.length === 0 && plan.unscheduled.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing to schedule in today’s window.
          </p>
        ) : plan ? (
          <div className="mt-4">
            {plan.conflicts.length > 0 && (
              <div className="mb-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                  Fixed times that overlap
                </p>
                <ul className="mt-1">
                  {plan.conflicts.map((clash) => (
                    <li key={`${clash.itemId}:${clash.otherItemId}`} className="py-1.5">
                      <span className="block text-sm font-medium leading-5">
                        {clash.title} at {clash.start} overlaps {clash.otherTitle} at{" "}
                        {clash.otherStart}
                      </span>
                      <span className="block text-xs leading-5 text-muted-foreground">
                        {clash.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ol>
              {plan.blocks.map((block) => (
                <li
                  key={block.itemId}
                  className="flex gap-3 border-t border-border/60 py-2.5 first:border-t-0 first:pt-0"
                >
                  <span className="w-14 shrink-0 pt-0.5">
                    <span className="block text-sm font-semibold tabular-nums">{block.start}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
                      {block.end}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-5">{block.title}</span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {block.reason}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            {plan.unscheduled.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground">No room left today</p>
                <ul className="mt-1">
                  {plan.unscheduled.map((left) => (
                    <li key={left.itemId} className="py-1.5">
                      <span className="block text-sm font-medium leading-5">{left.title}</span>
                      <span className="block text-xs leading-5 text-muted-foreground">
                        {left.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void applyPlan()}
                disabled={applying}
                className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {applying ? "Saving the plan…" : "Use this plan"}
              </button>
              <button
                type="button"
                onClick={() => setPlan(null)}
                disabled={applying}
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                Discard
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div className="min-w-0">
          <section id="priorities" aria-labelledby="priorities-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="priorities-heading" className="text-xl font-semibold sm:text-2xl">
                {view === "all" ? "All tasks" : "Your priorities"}
              </h2>
              {overdue > 0 && (
                <p className="text-sm text-red-700 dark:text-red-300">{overdue} overdue</p>
              )}
            </div>
            {view !== "all" && (
              <div role="group" aria-label="Pick a day" className="mt-4 grid grid-cols-7 gap-1">
                {week.map((iso) => {
                  const count = dueOn(iso).length;
                  const selected = tab === "day" && day === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${dayName(iso, "long")} ${Number(iso.slice(8))}, ${count} task${count === 1 ? "" : "s"}`}
                      onClick={() => {
                        setDay(iso);
                        setTab("day");
                      }}
                      className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs ${selected ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary active:bg-secondary"}`}
                    >
                      <span>{dayName(iso, "short")}</span>
                      <span
                        className={`text-base font-semibold tabular-nums ${selected ? "" : "text-foreground"}`}
                      >
                        {Number(iso.slice(8))}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${count === 0 ? "bg-transparent" : selected ? "bg-primary-foreground" : "bg-primary"}`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Task filters">
              {(
                [
                  ["day", dayLabel, dayTasks.length],
                  ["upcoming", "Upcoming", upcoming.length],
                  ["undated", "No date", undated.length],
                ] as const
              ).map(([value, label, count]) =>
                view === "all" ? null : (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={tab === value}
                    onClick={() => setTab(value)}
                    className={`min-h-11 rounded-lg border px-3 text-sm ${tab === value ? "border-primary bg-secondary font-semibold text-foreground" : "border-border text-muted-foreground hover:bg-secondary active:bg-secondary"}`}
                  >
                    {label} <span className="ml-1 text-xs tabular-nums">{count}</span>
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
                  {view === "all" || tab !== "day"
                    ? "No tasks here yet."
                    : day === todayDay
                      ? "Nothing due today."
                      : `Nothing due on ${dayName(day, "long")}.`}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tasks.length
                    ? "Pick another day or filter, or add a new conversation."
                    : "Add a WhatsApp conversation and NANTI lists the tasks in it here."}
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {visible.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
                    <p className="break-words text-xs leading-5 text-muted-foreground">
                      {[
                        projectOf(item.projectId)?.name || item.projectName,
                        personOf(item.personId)?.name || item.personName,
                        item.source ||
                          (item.sourceType === "paste" ? "Pasted conversation" : "Saved task"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <button
                      type="button"
                      onClick={() => openDetail(item.id)}
                      className="mt-1 min-h-11 text-left text-base font-semibold leading-6 hover:underline"
                    >
                      {item.title}
                    </button>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p
                        className={`flex items-center gap-1.5 text-xs ${isOverdue(item) ? "font-medium text-red-700 dark:text-red-300" : "text-muted-foreground"}`}
                      >
                        <Clock aria-hidden="true" className="size-3.5 shrink-0" />
                        {isOverdue(item) ? "Overdue · " : isDueToday(item) ? "Today · " : ""}
                        {item.due || "No deadline"}
                        {item.time ? ` · ${item.time}` : ""}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={pending !== null}
                          onClick={() => void action(item, "complete")}
                          aria-label={`Mark ${item.title} done`}
                          className="min-h-11 rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-secondary active:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {pending === item.id ? "Saving…" : "Done"}
                        </button>
                        <button
                          type="button"
                          disabled={pending !== null}
                          onClick={() => void action(item, "snooze")}
                          aria-label={`Postpone ${item.title} by one day`}
                          className={rowButton}
                        >
                          Later
                        </button>
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
              <h2 id="waiting-heading" className="text-xl font-semibold sm:text-2xl">
                Waiting for
              </h2>
              <Link
                to="/app/waiting"
                className="inline-flex min-h-11 items-center px-2 text-xs underline underline-offset-4"
              >
                View all
              </Link>
            </div>
            {waiting.length ? (
              <ul className="mt-2 space-y-3">
                {waiting.slice(0, 5).map((item) => (
                  <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
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
                <dd className="text-xs text-muted-foreground">
                  {settings.whatsappConnected ? "Connected" : "Connect in Settings"}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-4">
                <dt>Google Calendar</dt>
                <dd className="text-xs text-muted-foreground">
                  {settings.calendarConnected ? "Connected" : "Connect in Settings"}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              WhatsApp capture and reminders are available after connection. Calendar availability
              depends on your workspace configuration.
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
