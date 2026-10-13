/**
 * Deterministic day planner.
 *
 * Pure functions only: no imports, no I/O, no clock reads except the `now`
 * handed in by the caller. That keeps it testable in a bare `vm` context and
 * keeps the schedule explainable - every block carries the reason it exists.
 *
 * Rules, in order:
 *   1. Items that already carry a time keep it. They are anchors, not guesses.
 *   2. Everything else is packed forward from "now" inside the work window,
 *      never overlapping an anchor.
 *   3. Order is urgency: overdue, due today, upcoming soonest-first, then
 *      items with no deadline fill whatever gap is left.
 *   4. Anything that does not fit is reported back instead of silently dropped.
 */

export interface PlannerItem {
  id: string;
  title: string;
  status?: string | null | undefined;
  kind?: string | null | undefined;
  due?: string | null | undefined;
  time?: string | null | undefined;
  priority?: string | null | undefined;
}

export interface PlanBlock {
  itemId: string;
  title: string;
  start: string;
  end: string;
  reason: string;
  fixed: boolean;
}

export interface UnscheduledItem {
  itemId: string;
  title: string;
  reason: string;
}

export interface DayPlan {
  blocks: PlanBlock[];
  unscheduled: UnscheduledItem[];
  windowStart: string;
  windowEnd: string;
  blockMinutes: number;
  plannedFor: string;
  anchorCount: number;
  flexibleCount: number;
}

export interface PlanOptions {
  now?: Date | undefined;
  today?: string | undefined;
  windowStart?: string | undefined;
  windowEnd?: string | undefined;
  blockMinutes?: number | undefined;
}

export const PLANNER_WINDOW_START = "09:00";
export const PLANNER_WINDOW_END = "18:00";
export const PLANNER_BLOCK_MINUTES = 30;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const RANK_URGENCY_OVERDUE = 0;
const RANK_URGENCY_TODAY = 1;
const RANK_URGENCY_UPCOMING = 2;
const RANK_URGENCY_UNDATED = 3;

const RANK_PRIORITY: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PRIORITY_RANK_DEFAULT = 2;

/** Accepts "YYYY-MM-DD" or any ISO timestamp, returns the calendar day part. */
function dayOf(value?: string | null | undefined): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : undefined;
}

function todayKey(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function toMinutes(hhmm?: string | null | undefined): number {
  if (!hhmm) return -1;
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return -1;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return -1;
  return hours * 60 + minutes;
}

export function toHHMM(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const hours = String(Math.floor(clamped / 60)).padStart(2, "0");
  const rest = String(clamped % 60).padStart(2, "0");
  return `${hours}:${rest}`;
}

function formatDue(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3) return iso;
  const day = parts[2];
  const month = parts[1];
  if (day === undefined || month === undefined || Number.isNaN(day) || Number.isNaN(month)) {
    return iso;
  }
  return `${day} ${MONTHS[month - 1] ?? iso}`;
}

function priorityRank(priority?: string | null | undefined): number {
  const key = (priority ?? "").toLowerCase();
  return RANK_PRIORITY[key] ?? PRIORITY_RANK_DEFAULT;
}

function urgencyRank(item: PlannerItem, today: string): number {
  const due = dayOf(item.due);
  if (!due) return RANK_URGENCY_UNDATED;
  if (due < today) return RANK_URGENCY_OVERDUE;
  if (due === today) return RANK_URGENCY_TODAY;
  return RANK_URGENCY_UPCOMING;
}

function reasonFor(item: PlannerItem, today: string): string {
  const due = dayOf(item.due);
  const priority = (item.priority ?? "").toLowerCase();

  if (due && due < today) return "Overdue, so it comes first";
  if (due === today) {
    if (priority === "critical") return "Due today, marked critical";
    if (priority === "high") return "Due today, marked high";
    return "Due today";
  }
  if (due) return `Due ${formatDue(due)}`;
  return "No deadline, so it takes the gap";
}

function isSchedulable(item: PlannerItem): boolean {
  if (item.status && item.status !== "open") return false;
  if (item.kind === "waiting") return false;
  if (!item.id || !item.title) return false;
  return true;
}

/**
 * First gap of `duration` minutes at or after `from`, avoiding every occupied
 * interval. Returns null when the window closes before the block would end.
 */
function findGap(
  from: number,
  duration: number,
  occupied: Array<[number, number]>,
  windowEnd: number,
): number | null {
  let position = from;
  const sorted = [...occupied].sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sorted) {
    if (end <= position) continue;
    if (start >= position + duration) break;
    position = Math.max(position, end);
  }

  return position + duration <= windowEnd ? position : null;
}

export function planDay(items: PlannerItem[], options: PlanOptions = {}): DayPlan {
  const now = options.now ?? new Date();
  const today = options.today ?? todayKey(now);
  const windowStart = toMinutes(options.windowStart ?? PLANNER_WINDOW_START);
  const windowEnd = toMinutes(options.windowEnd ?? PLANNER_WINDOW_END);
  const blockMinutes = Math.max(5, Math.min(240, options.blockMinutes ?? PLANNER_BLOCK_MINUTES));

  const anchors: PlannerItem[] = [];
  const flexible: PlannerItem[] = [];

  for (const item of items) {
    if (!isSchedulable(item)) continue;
    const anchored = toMinutes(item.time);
    if (anchored >= 0) anchors.push(item);
    else flexible.push(item);
  }

  const occupied: Array<[number, number]> = [];
  for (const anchor of anchors) {
    occupied.push([toMinutes(anchor.time), toMinutes(anchor.time) + blockMinutes]);
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const roundUp = Math.ceil(nowMinutes / 15) * 15;
  let cursor = Math.max(windowStart, roundUp);

  flexible.sort((a, b) => {
    const rankDiff = urgencyRank(a, today) - urgencyRank(b, today);
    if (rankDiff !== 0) return rankDiff;

    const dueA = dayOf(a.due) ?? "";
    const dueB = dayOf(b.due) ?? "";
    if (dueA !== dueB) return dueA < dueB ? -1 : 1;

    const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    return a.title.localeCompare(b.title);
  });

  const blocks: PlanBlock[] = anchors.map((anchor) => {
    const start = toMinutes(anchor.time);
    return {
      itemId: anchor.id,
      title: anchor.title,
      start: toHHMM(start),
      end: toHHMM(start + blockMinutes),
      reason: `You set ${toHHMM(start)}`,
      fixed: true,
    };
  });

  const unscheduled: UnscheduledItem[] = [];

  for (const item of flexible) {
    const slot = findGap(cursor, blockMinutes, occupied, windowEnd);
    if (slot === null) {
      unscheduled.push({
        itemId: item.id,
        title: item.title,
        reason: `No room left before ${toHHMM(windowEnd)}`,
      });
      continue;
    }

    occupied.push([slot, slot + blockMinutes]);
    cursor = slot + blockMinutes;

    blocks.push({
      itemId: item.id,
      title: item.title,
      start: toHHMM(slot),
      end: toHHMM(slot + blockMinutes),
      reason: reasonFor(item, today),
      fixed: false,
    });
  }

  blocks.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  return {
    blocks,
    unscheduled,
    windowStart: toHHMM(windowStart),
    windowEnd: toHHMM(windowEnd),
    blockMinutes,
    plannedFor: today,
    anchorCount: anchors.length,
    flexibleCount: flexible.length,
  };
}
