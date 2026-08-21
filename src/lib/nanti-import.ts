import type { ExtractedItem } from "./nanti-ai.server";
import type { Item, Person, Project, SourceType } from "./nanti-types";
import { dayOffset } from "./nanti-demo";
import { newId, todayISO } from "./nanti-utils";

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
  const person = matchPerson(ctx.people, draft.person);
  const project = matchProject(ctx.projects, draft.project);
  const due =
    draft.kind === "waiting" || draft.dueOffsetDays == null ? undefined : dayOffset(draft.dueOffsetDays);

  const item: Item = {
    id: newId("ai"),
    title: draft.title,
    kind: draft.kind,
    status: "open",
    priority: draft.priority,
    ...(due ? { due } : {}),
    ...(draft.kind === "waiting" ? { since: todayISO() } : {}),
    ...(person ? { personId: person.id } : {}),
    ...(draft.person ? { personName: draft.person } : {}),
    ...(project ? { projectId: project.id } : {}),
    ...(draft.project ? { projectName: draft.project } : {}),
    source: draft.source || ctx.sourceName || "Impor percakapan",
    sourceType: ctx.sourceType,
    quote: draft.quote,
    aiNote: draft.aiNote,
    confidence: draft.confidence,
    createdBy: "ai",
    createdAt: new Date().toISOString(),
  };
  return item;
}
