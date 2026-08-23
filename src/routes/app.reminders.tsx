import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Bell, BellOff } from "lucide-react";
import { PageHeader, Section, EmptyState } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import { isOverdue, isDueToday, isUpcoming, dueLabel } from "@/lib/nanti-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders - NANTI" },
      { name: "description", content: "Your commitments and deadlines." },
    ],
  }),
  component: RemindersPage,
});

type Tab = "active" | "completed";

function RemindersPage() {
  const { items, personOf, toggleReminder, complete, snooze } = useNanti();
  const [tab, setTab] = useState<Tab>("active");

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
