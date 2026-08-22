import type { Item, ItemKind, Priority } from "./nanti-types";

export const TIMEZONE = "Asia/Jakarta";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Current calendar day in Asia/Jakarta as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return dayFormatter.format(now);
}

/** Accepts YYYY-MM-DD or any ISO timestamp; returns the calendar day part, or undefined. */
export function normalizeDay(value?: string | null): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return dayFormatter.format(parsed);
  }
  const [, y, m, d] = match;
  const num = Date.UTC(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(num)) return undefined;
  return `${y}-${m}-${d}`;
}

/** Days since the Unix epoch for a calendar day, or undefined when unparseable. */
function dayNumber(value?: string | null): number | undefined {
  const day = normalizeDay(value);
  if (!day) return undefined;
  const [y, m, d] = day.split("-").map(Number);
  return Math.round(Date.UTC(y!, m! - 1, d!) / 86400000);
}

/** Signed day distance from today (Jakarta). undefined when the date is missing/invalid. */
export function dayDiff(value?: string | null): number | undefined {
  const target = dayNumber(value);
  if (target === undefined) return undefined;
  const base = dayNumber(todayISO());
  if (base === undefined) return undefined;
  return target - base;
}

/** Backwards-compatible helper: 0 when the date is missing or invalid. */
export function daysBetween(iso?: string) {
  return dayDiff(iso) ?? 0;
}

export function addDays(iso: string | undefined, days: number): string {
  const day = normalizeDay(iso) ?? todayISO();
  const [y, m, d] = day.split("-").map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d!));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export const today = () => new Date(`${todayISO()}T00:00:00Z`);

export function toDate(iso?: string) {
  const day = normalizeDay(iso);
  return day ? new Date(`${day}T00:00:00Z`) : undefined;
}

export function isOverdue(item: Item) {
  if (item.status !== "open" || item.kind === "waiting") return false;
  const diff = dayDiff(item.due);
  return diff !== undefined && diff < 0;
}

export function isDueToday(item: Item) {
  if (item.status !== "open" || item.kind === "waiting") return false;
  return dayDiff(item.due) === 0;
}

export function isUpcoming(item: Item) {
  if (item.status !== "open" || item.kind === "waiting") return false;
  const diff = dayDiff(item.due);
  return diff !== undefined && diff > 0;
}

export function dueLabel(item: Item) {
  const diff = dayDiff(item.due);
  if (diff === undefined) return "Tanpa tenggat";
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff === -1) return "Kemarin";
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`;
  return `${diff} hari lagi`;
}

/** How many days an item has been waiting. Never negative, 0 when unknown. */
export function waitingDays(item: Item) {
  const diff = dayDiff(item.since);
  if (diff === undefined) return 0;
  return Math.max(0, -diff);
}

export function formatDate(iso?: string, locale = "id-ID") {
  const day = normalizeDay(iso);
  if (!day) return "—";
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDayHeadline(locale = "id-ID") {
  return new Date(`${todayISO()}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function jakartaHour(now: Date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, hour: "2-digit", hour12: false }).format(
      now,
    ),
  );
}

export function greeting(name: string) {
  const h = jakartaHour();
  const part =
    h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  return `${part}, ${name}`;
}

export { jakartaHour };

export const kindLabel: Record<ItemKind, string> = {
  task: "Tugas",
  commitment: "Janji",
  deadline: "Tenggat",
  waiting: "Menunggu",
  followup: "Follow-up",
};

export const priorityLabel: Record<Priority, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

export function openItems(items: Item[]) {
  return items.filter((i) => i.status === "open");
}

export function newId(prefix = "x") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
