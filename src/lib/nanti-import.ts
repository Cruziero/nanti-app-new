import type { ExtractedItem } from "./nanti-ai.server";
import type { Item, Person, Project, SourceType } from "./nanti-types";
import { dayOffset } from "./nanti-demo";
import { newId, todayISO } from "./nanti-utils";
import { parseSmartDate } from "./nanti-dates";

export type Draft = ExtractedItem;

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

  const item: Item = {
    id: newId("ai"),
    title: draft.title || draft.what || "",
    description: draft.action || undefined,
    kind: draft.kind,
    status: draft.needsClarification ? "inbox" : "open",
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
    createdBy: "ai",
    createdAt: new Date().toISOString(),
    reminderEnabled: draft.reminderRequired,
    reminderChannels: draft.reminderRequired ? ["in_app", "push"] : [],
    reminderIntensity: "normal",
  };
  return item;
}
