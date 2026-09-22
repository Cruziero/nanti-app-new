import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Bell, BellOff, X } from "lucide-react";
import { PageHeader, Section, EmptyState } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import { isOverdue, isDueToday, isUpcoming, dueLabel } from "@/lib/nanti-utils";
import { cn } from "@/lib/utils";
import { fetchNotifications, updateNotification } from "@/lib/nanti-supabase";

export const Route = createFileRoute("/app/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders - NANTI" },
      { name: "description", content: "Your commitments and deadlines." },
    ],
  }),
  component: RemindersPage,
});

type NantiNotification = {
  id: string;
  item_id?: string | null;
  notification_type: "task_due" | "task_overdue" | "waiting_followup" | "briefing";
  title: string;
  body: string;
  status: "unread" | "read" | "dismissed";
  created_at: string;
};

type Tab = "active" | "completed";

function RemindersPage() {
  const { items, personOf, toggleReminder, complete, snooze } = useNanti();
  const [tab, setTab] = useState<Tab>("active");
  const [notifications, setNotifications] = useState<NantiNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchNotifications();
        if (!cancelled) setNotifications(rows as NantiNotification[]);
      } catch (error) {
        console.error("Failed to load NANTI notifications:", error);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const dismissNotification = async (id: string) => {
    try {
      await updateNotification({ data: { id, status: "dismissed" } });
      setNotifications((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const itemsWithReminders = items.filter((i) => i.reminderEnabled);
  const activeItems = itemsWithReminders.filter((i) => i.status === "open");
  const completedItems = itemsWithReminders.filter(
    (i) => i.status === "done" || i.status === "received",
  );
  const displayItems = tab === "active" ? activeItems : completedItems;

  const overdueItems = activeItems.filter(isOverdue);
  const dueTodayItems = activeItems.filter(isDueToday);
  const upcomingItems = activeItems.filter(isUpcoming);

  return (
    <div>
      <PageHeader
        title="Reminders"
        subtitle="Your commitments and deadlines"
        action={
          <div className="flex gap-1">
            {(["active", "completed"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {t === "active" ? "Active" : "Completed"}
              </button>
            ))}
          </div>
        }
      />

      {tab === "active" && notifications.some((notice) => notice.status === "unread") && (
        <section className="mb-7 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-primary">
              NANTI nudges
            </h2>
          </div>
          <div className="divide-y divide-primary/10">
            {notifications
              .filter((notice) => notice.status === "unread")
              .slice(0, 8)
              .map((notice) => (
                <div key={notice.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{notice.title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-5 text-muted-foreground">
                      {notice.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => void dismissNotification(notice.id)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </section>
      )}

      {tab === "active" && overdueItems.length > 0 && (
        <Section title="Overdue" count={overdueItems.length}>
          {overdueItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name}
              onComplete={() => complete(item.id)}
              onSnooze={() => snooze(item.id, 1)}
              onToggle={() => toggleReminder(item.id)}
            />
          ))}
        </Section>
      )}

      {tab === "active" && dueTodayItems.length > 0 && (
        <Section title="Today" count={dueTodayItems.length}>
          {dueTodayItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name}
              onComplete={() => complete(item.id)}
              onSnooze={() => snooze(item.id, 1)}
              onToggle={() => toggleReminder(item.id)}
            />
          ))}
        </Section>
      )}

      {tab === "active" && upcomingItems.length > 0 && (
        <Section title="Upcoming" count={upcomingItems.length}>
          {upcomingItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name}
              onComplete={() => complete(item.id)}
              onSnooze={() => snooze(item.id, 1)}
              onToggle={() => toggleReminder(item.id)}
            />
          ))}
        </Section>
      )}

      {tab === "completed" && completedItems.length > 0 && (
        <Section title="Completed" count={completedItems.length}>
          {completedItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name}
              onComplete={() => {}}
              onSnooze={() => {}}
              onToggle={() => toggleReminder(item.id)}
              completed
            />
          ))}
        </Section>
      )}

      {displayItems.length === 0 && (
        <EmptyState
          title={tab === "active" ? "No active reminders" : "No completed reminders"}
          hint="Enable reminders on your commitments to see them here."
        />
      )}
    </div>
  );
}

function ReminderRow({
  item,
  personName,
  onComplete,
  onSnooze,
  onToggle,
  completed,
}: {
  item: {
    id: string;
    title: string;
    kind: string;
    due?: string;
    time?: string;
    status: string;
    reminderChannels?: string[];
  };
  personName?: string;
  onComplete: () => void;
  onSnooze: () => void;
  onToggle: () => void;
  completed?: boolean;
}) {
  const diff = item.due ? dueLabel(item as never) : null;

  return (
    <div className={cn("flex items-center gap-3 px-1 py-3", completed && "opacity-50")}>
      <button
        onClick={onComplete}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary/50",
        )}
      >
        {completed && <Check className="size-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13.5px] font-medium", completed && "line-through")}>
          {item.title}
        </p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          {personName && `${personName} - `}
          {item.due || "No date"}
          {diff && !completed && ` - ${diff}`}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {item.reminderChannels?.map((ch) => (
          <span
            key={ch}
            className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {ch === "whatsapp" ? "WA" : ch === "push" ? "Push" : ch === "calendar" ? "Cal" : "App"}
          </span>
        ))}
      </div>
      {!completed && (
        <button
          onClick={onToggle}
          className="text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          <BellOff className="size-3.5" />
        </button>
      )}
    </div>
  );
}
