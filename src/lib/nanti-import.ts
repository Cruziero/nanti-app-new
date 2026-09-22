import type { ExtractedItem } from "./nanti-ai.server";
import type { Item, Person, Project, SourceType } from "./nanti-types";
import { dayOffset } from "./nanti-demo";
import { newId, todayISO } from "./nanti-utils";
import { parseSmartDate } from "./nanti-dates";

export type Draft = ExtractedItem;

function defaultReminderTime(due?: string, time?: string) {
  if (!due) return undefined;
  const dueAt = new Date(`${due}T${time || "09:00"}:00+07:00`);
  if (Number.isNaN(dueAt.getTime())) return undefined;
  const offsetMinutes = time ? 60 : 0;
  const reminder = new Date(dueAt.getTime() - offsetMinutes * 60_000);
  return reminder.toISOString();
}

function clarificationType(fields?: string[]) {
  const first = fields?.[0]?.toLowerCase();
  if (!first) return undefined;
  if (first.includes("person") || first.includes("who")) return "person" as const;
  if (first.includes("time") || first.includes("jam")) return "time" as const;
  if (first.includes("date") || first.includes("when") || first.includes("tanggal")) return "date" as const;
  return "confirmation" as const;
}

function matchPerson(people: Person[], name?: string | null) {
  if (!name) return undefined;
  const first = name.toLowerCase().split(" ").filter(Boolean)[0];
  if (!first) return undefined;
  return people.find((p) => p.name.toLowerCase().includes(first));
}

function matchProject(projects: Project[], name?: string | null) {
  if (!name) return undefined;
  const needle = name.toLowerCase();
  return projects.find(
    (p) => p.name.toLowerCase().includes(needle) || needle.includes(p.name.toLowerCase()),
  );
}

/** Turn an AI draft into a tracked NANTI item. */
export function draftToItem(
  draft: Draft,
  ctx: { people: Person[]; projects: Project[]; sourceType: SourceType; sourceName?: string },
): Item {
  const person = matchPerson(ctx.people, draft.person || draft.who);
  const project = matchProject(ctx.projects, draft.project);

  // Determine due date from structured fields
  let due: string | undefined;
  let time: string | undefined;

  if (draft.kind === "waiting") {
    due = undefined;
  } else if (draft.whenParsed) {
    due = draft.whenParsed;
  } else if (draft.when) {
    const parsed = parseSmartDate(draft.when);
    due = parsed.date ?? undefined;
    time = parsed.time ?? undefined;
  } else if (draft.dueOffsetDays != null) {
    due = dayOffset(draft.dueOffsetDays);
  }

  if (draft.dueTime) {
    time = draft.dueTime;
  }

  const needsClarification = Boolean(draft.needsClarification) || draft.confidence < 0.72;
  const reminderEnabled = draft.kind !== "waiting" && (Boolean(due) || Boolean(draft.reminderRequired));
  const item: Item = {
    id: newId("ai"),
    title: draft.title || draft.what || "",
    description: draft.action || undefined,
    kind: draft.kind,
    status: needsClarification ? "inbox" : "open",
    priority: draft.priority,
    ...(due ? { due } : {}),
    ...(time ? { time } : {}),
    ...(draft.kind === "waiting" ? { since: todayISO() } : {}),
    ...(person ? { personId: person.id } : {}),
    ...(draft.person || draft.who ? { personName: draft.person || draft.who || undefined } : {}),
    ...(project ? { projectId: project.id } : {}),
    ...(draft.project ? { projectName: draft.project } : {}),
    source: draft.source || ctx.sourceName || "Impor percakapan",
    sourceType: ctx.sourceType,
    quote: draft.quote,
    aiNote: draft.aiNote,
    confidence: draft.confidence,
    memoryStrength: needsClarification ? 0.5 : 1.0,
    createdBy: "ai",
    createdAt: new Date().toISOString(),
    reminderEnabled,
    reminderTime: reminderEnabled ? defaultReminderTime(due, time) : undefined,
    reminderChannels: reminderEnabled ? ["in_app", "push"] : [],
    reminderIntensity: "normal",
    ...(draft.kind === "waiting"
      ? {
          followUpAt: new Date(Date.now() + 2 * 86400000).toISOString(),
          followUpCount: 0,
          autoFollowUpEnabled: true,
        }
      : {}),
    ...(needsClarification
      ? {
          clarificationType: clarificationType(draft.missingFields),
          clarificationQuestion:
            draft.clarifyingQuestion ||
            (draft.kind === "waiting"
              ? "Kamu sedang menunggu siapa?"
              : "Mau NANTI simpan ini sebagai tugas?"),
        }
      : {}),
  };
  return item;
}


/**
 * Best-effort local fallback when AI extraction is unavailable.
 * Only creates a draft for explicit self-actions / reminders to avoid turning casual chat into tasks.
 */
export function chatMessageToFallbackItem(
  text: string,
  ctx: { people: Person[]; projects: Project[] },
): Item | null {
  const normalized = text.trim();
  if (!normalized) return null;
  const lower = normalized.toLowerCase();
  const actionable =
    /\b(harus|perlu|mesti|wajib|jangan\s+lupa|tolong\s+ingat|tolong\s+ingetin|ingatkan|remind|need\s+to|have\s+to|must)\b/i.test(
      lower,
    );
  if (!actionable) return null;

  const parsed = parseSmartDate(normalized);
  const title = normalized
    .replace(/^\s*(besok|bsk|hari ini|lusa)\s*[,.:;-]?\s*/i, "")
    .replace(/^\s*(saya|sy|aku|gue|gw)\s+(harus|perlu|mesti|wajib)\s+/i, "")
    .trim();

  return {
    id: newId("chat"),
    title: title || normalized,
    kind: "task",
    status: "open",
    priority: "medium",
    ...(parsed.date ? { due: parsed.date } : {}),
    ...(parsed.time ? { time: parsed.time } : {}),
    source: "Chat dengan NANTI",
    sourceType: "chat",
    quote: normalized,
    aiNote: "Dibuat dari pesan chat yang berisi tindakan eksplisit untuk Anda.",
    confidence: parsed.date || parsed.time ? 0.9 : 0.75,
    memoryStrength: 1,
    createdBy: "ai",
    createdAt: new Date().toISOString(),
    reminderEnabled: Boolean(parsed.date || parsed.time),
    reminderTime: parsed.date ? defaultReminderTime(parsed.date, parsed.time ?? undefined) : undefined,
    reminderChannels: parsed.date || parsed.time ? ["in_app", "push"] : [],
    reminderIntensity: "normal",
  };
}
