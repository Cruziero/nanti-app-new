import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Clock, Check, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import { PageHeader, Section, EmptyState } from "@/components/nanti/app-shell";
import { KindBadge } from "@/components/nanti/kind-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNanti } from "@/lib/nanti-store";
import {
  isOverdue,
  isDueToday,
  isUpcoming,
  dueLabel,
  formatDate,
  waitingDays,
} from "@/lib/nanti-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/reminders")({
  head: () => ({
    meta: [
      { title: "Pengingat · NANTI" },
      { name: "description", content: "Kelola pengingat untuk komitmen dan tugas Anda." },
    ],
  }),
  component: RemindersPage,
});

type Tab = "all" | "active" | "completed";

function RemindersPage() {
  const { items, personOf, toggleReminder, complete, snooze } = useNanti();
  const [tab, setTab] = useState<Tab>("all");

  const itemsWithReminders = items.filter((i) => i.reminderEnabled);
  const activeItems = itemsWithReminders.filter((i) => i.status === "open");
  const completedItems = itemsWithReminders.filter(
    (i) => i.status === "done" || i.status === "received",
  );

  const displayItems =
    tab === "active" ? activeItems : tab === "completed" ? completedItems : itemsWithReminders;

  const overdueItems = activeItems.filter(isOverdue);
  const dueTodayItems = activeItems.filter(isDueToday);
  const upcomingItems = activeItems.filter(isUpcoming);
  const waitingItems = activeItems.filter((i) => i.kind === "waiting");

  return (
    <div>
      <PageHeader title="Pengingat" subtitle="Semua pengingat untuk komitmen dan tugas Anda" />

      <div className="mb-6 flex gap-2">
        {(["all", "active", "completed"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "all" ? "Semua" : t === "active" ? "Aktif" : "Selesai"}
          </button>
        ))}
      </div>

      {overdueItems.length > 0 && (
        <Section title="Terlambat" count={overdueItems.length}>
          {overdueItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name || item.personName}
              onComplete={() => complete(item.id)}
              onSnooze={() => snooze(item.id, 1)}
              onToggle={() => toggleReminder(item.id)}
            />
          ))}
        </Section>
      )}

      {dueTodayItems.length > 0 && (
        <Section title="Jatuh Tempo Hari Ini" count={dueTodayItems.length}>
          {dueTodayItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name || item.personName}
              onComplete={() => complete(item.id)}
              onSnooze={() => snooze(item.id, 1)}
              onToggle={() => toggleReminder(item.id)}
            />
          ))}
        </Section>
      )}

      {upcomingItems.length > 0 && (
        <Section title="Mendatang" count={upcomingItems.length}>
          {upcomingItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name || item.personName}
              onComplete={() => complete(item.id)}
              onSnooze={() => snooze(item.id, 1)}
              onToggle={() => toggleReminder(item.id)}
            />
          ))}
        </Section>
      )}

      {waitingItems.length > 0 && (
        <Section title="Menunggu" count={waitingItems.length}>
          {waitingItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name || item.personName}
              onComplete={() => complete(item.id)}
              onSnooze={() => snooze(item.id, 1)}
              onToggle={() => toggleReminder(item.id)}
            />
          ))}
        </Section>
      )}

      {tab === "completed" && completedItems.length > 0 && (
        <Section title="Selesai" count={completedItems.length}>
          {completedItems.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              personName={personOf(item.personId)?.name || item.personName}
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
          title="Belum ada pengingat"
          hint="Aktifkan pengingat pada tugas atau komitmen untuk melihatnya di sini."
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
    since?: string;
    reminderEnabled?: boolean;
    reminderChannels?: string[];
    status: string;
  };
  personName?: string;
  onComplete: () => void;
  onSnooze: () => void;
  onToggle: () => void;
  completed?: boolean;
}) {
  const overdue = isOverdue(item as never);
  const diff = item.due ? dueLabel(item as never) : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/30",
        completed && "opacity-60",
      )}
    >
      <button
        onClick={onComplete}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary",
        )}
      >
        {completed && <Check className="size-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={item.kind as never} />
          <span className={cn("text-[14px] font-medium", completed && "line-through")}>
            {item.title}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          {personName && <span>{personName}</span>}
          {diff && (
            <span className={cn(overdue && "font-medium text-red-500")}>
              {item.time && `${item.time} · `}
              {diff}
            </span>
          )}
          {item.reminderChannels && item.reminderChannels.length > 0 && (
            <span className="flex items-center gap-1">
              <Bell className="size-3" />
              {item.reminderChannels.join(", ")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!completed && (
          <Button variant="ghost" size="sm" onClick={onSnooze} className="text-[12px]">
            Tunda
          </Button>
        )}
        <Switch checked={!!item.reminderEnabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
