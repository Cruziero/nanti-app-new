import type { DailyBriefing, Item, Person, ReminderPreferences } from "./nanti-types";
import {
  todayISO,
  isOverdue,
  isDueToday,
  isUpcoming,
  greeting,
  dueLabel,
  waitingDays,
  kindLabel,
} from "./nanti-utils";

export function generateDailyBriefing(
  items: Item[],
  people: Person[],
  prefs: ReminderPreferences,
  userName: string,
): DailyBriefing {
  const today = todayISO();
  const openItems = items.filter((i) => i.status === "open");
  const dueToday = openItems.filter((i) => isDueToday(i));
  const overdue = openItems.filter((i) => isOverdue(i));
  const waiting = openItems.filter((i) => i.kind === "waiting");
  const upcoming = openItems.filter((i) => isUpcoming(i));

  // Potentially forgotten: overdue items with high priority or old waiting items
  const potentiallyForgotten: string[] = [];
  for (const item of overdue) {
    if (item.priority === "high" || item.priority === "critical") {
      potentiallyForgotten.push(`${item.title}${item.personName ? ` — ${item.personName}` : ""}`);
    }
  }
  for (const item of waiting) {
    const days = waitingDays(item);
    if (days >= 3) {
      potentiallyForgotten.push(
        `${item.title}${item.personName ? ` — ${item.personName}` : ""} (${days} hari menunggu)`,
      );
    }
  }

  // Priorities: high/critical items due today or overdue
  const priorities: string[] = [];
  for (const item of [...overdue, ...dueToday]) {
    if (item.priority === "high" || item.priority === "critical") {
      priorities.push(`${item.title}${item.personName ? ` untuk ${item.personName}` : ""}`);
    }
  }

  // Build summary
  const totalTasks = dueToday.length + overdue.length;
  const parts: string[] = [];
  if (dueToday.length > 0) parts.push(`${dueToday.length} tenggat hari ini`);
  if (overdue.length > 0) parts.push(`${overdue.length} terlambat`);
  if (waiting.length > 0) parts.push(`${waiting.length} menunggu`);
  if (potentiallyForgotten.length > 0)
    parts.push(`${potentiallyForgotten.length} mungkin terlupakan`);

  const summary =
    parts.length > 0
      ? `Anda punya ${parts.join(", ")}.`
      : "Tidak ada yang perlu dikhawatirkan hari ini.";

  return {
    date: today,
    greeting: greeting(userName),
    summary,
    stats: {
      totalTasks,
      dueToday: dueToday.length,
      overdue: overdue.length,
      waiting: waiting.length,
      calendarEvents: 0,
    },
    priorities: priorities.slice(0, 5),
    potentiallyForgotten: potentiallyForgotten.slice(0, 5),
    calendarContext: [],
  };
}

export function generateBriefingText(briefing: DailyBriefing): string {
  const lines: string[] = [];
  lines.push(briefing.greeting);
  lines.push("");
  lines.push(briefing.summary);

  if (briefing.priorities.length > 0) {
    lines.push("");
    lines.push("Yang paling penting:");
    for (const p of briefing.priorities) {
      lines.push(`- ${p}`);
    }
  }

  if (briefing.potentiallyForgotten.length > 0) {
    lines.push("");
    lines.push("Mungkin terlupakan:");
    for (const f of briefing.potentiallyForgotten) {
      lines.push(`- ${f}`);
    }
  }

  return lines.join("\n");
}

export function getTodayStats(items: Item[]) {
  const openItems = items.filter((i) => i.status === "open");
  return {
    total: openItems.length,
    overdue: openItems.filter((i) => isOverdue(i)).length,
    dueToday: openItems.filter((i) => isDueToday(i)).length,
    waiting: openItems.filter((i) => i.kind === "waiting").length,
    upcoming: openItems.filter((i) => isUpcoming(i)).length,
  };
}
