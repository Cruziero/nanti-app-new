import type { ExtractedItem } from "./nanti-ai.server";
import type { Item, Person, Project, SourceType } from "./nanti-types";
import { dayOffset } from "./nanti-demo";
import { newId, todayISO } from "./nanti-utils";
import { parseSmartDate } from "./nanti-dates";
import {
  normalizeActionTitle,
  normalizeCasualIndonesian,
} from "./nanti-language";

export type Draft = ExtractedItem;

function defaultReminderTime(due?: string, time?: string, offsetMinutes?: number | null) {
  if (!due) return undefined;
  const dueAt = new Date(`${due}T${time || "09:00"}:00+07:00`);
  if (Number.isNaN(dueAt.getTime())) return undefined;
  const fallbackOffset = time ? 60 : 0;
  const offset = offsetMinutes == null ? fallbackOffset : Math.max(0, offsetMinutes);
  const reminder = new Date(dueAt.getTime() - offset * 60_000);
  return reminder.toISOString();
}

// Words that follow "di/ke/dari" but are not places ("di muka", "di luar", "di sini").
const NON_PLACE_WORDS = new Set([
  "muka",
  "luar",
  "dalam",
  "atas",
  "bawah",
  "depan",
  "belakang",
  "samping",
  "antara",
  "sini",
  "situ",
  "sana",
  "online",
  "awal",
  "akhir",
  "sela",
  "tengah",
]);

function inferLocation(text: string) {
  const normalized = normalizeCasualIndonesian(text);
  const match = /\b(?:dari|ke|di)\s+(.+?)(?=\s+(?:jam|pukul|tanggal|besok|besok|lusa|hari\s+ini|untuk|dan|dan)\b|$)/i.exec(
    normalized,
  );
  const candidate = match?.[1]?.trim().replace(/[.,!?;:]+$/, "");
  if (!candidate || /^(pak|bapak|bu|ibu|mbak|mas)\b/i.test(candidate)) return undefined;
  if (/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu|besok|lusa|hari)$/i.test(candidate)) return undefined;
  if (NON_PLACE_WORDS.has(candidate.split(/\s+/)[0]!.toLowerCase())) return undefined;
  return candidate;
}

function inferRelatedPerson(text: string) {
  const normalized = normalizeCasualIndonesian(text);
  const match = /\b(pak|bapak|bu|ibu|mbak|mas|si)\s+([A-Za-z][A-Za-z'-]*(?:\s+(?!(?:jam|pukul|tanggal|besok|hari|di|ke|dari|untuk|soal|tentang|via|lewat)\b)[A-Za-z][A-Za-z'-]*)?)/i.exec(
    normalized,
  );
  if (!match) return undefined;
  return `${match[1]} ${match[2]}`.trim();
}

function inferMethod(text: string) {
  const lower = normalizeCasualIndonesian(text).toLowerCase();
  if (/\b(whatsapp|via\s+wa|lewat\s+wa)\b/.test(lower)) return "WhatsApp";
  if (/\b(email|e-mail)\b/.test(lower)) return "Email";
  if (/\b(telepon|call|phone)\b/.test(lower)) return "Telepon";
  if (/\b(zoom)\b/.test(lower)) return "Zoom";
  if (/\b(gmeet|google\s+meet)\b/.test(lower)) return "Google Meet";
  if (/\b(transfer|bank\s+transfer)\b/.test(lower)) return "Transfer";
  const transport =
    /\b(?:naik\s+)?(mobil|motor|kereta|pesawat|ojek|taxi|taksi|grab|gojek|go-jek|bus|angkot|transjakarta|sepeda|kapal|ferry|bajaj)\b/.exec(
      lower,
    );
  return transport ? `Naik ${transport[1]}` : undefined;
}

function fallbackReminderPlan(title: string, text: string, due?: string, time?: string) {
  if (!due && !time) return undefined;
  const lower = normalizeCasualIndonesian(text).toLowerCase();
  const travel = /\b(pulang|berangkat|pergi|kembali|meeting|rapat|appointment|janji temu)\b/.test(
    lower,
  );
  const quickAction = /\b(kirim|bayar|telepon|call|followup|follow up)\b/.test(lower);
  const offsetMinutes = time ? (travel ? 60 : quickAction ? 15 : 30) : 0;
  const strategy = time ? "before" as const : "morning_of" as const;
  return {
    shouldRemind: true,
    strategy,
    offsetMinutes,
    reason: time
      ? travel
        ? "Beri waktu untuk bersiap sebelum aktivitas dimulai."
        : "Beri jeda singkat agar tindakan tidak terlambat."
      : "Ingatkan pada pagi hari tenggat.",
    message: `Ingat: ${title}`,
  };
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
  const relatedPersonName =
    draft.person || (draft.who && draft.who !== "user" ? draft.who : null);
  const person = matchPerson(ctx.people, relatedPersonName);
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
  const reminderPlan =
    draft.reminder ||
    fallbackReminderPlan(draft.title || draft.what || "Tugas", draft.quote || draft.normalizedText || "", due, time);
  const reminderEnabled =
    draft.kind !== "waiting" &&
    Boolean(reminderPlan?.shouldRemind || due || draft.reminderRequired);
  const semanticContext = {
    normalizedText: draft.normalizedText,
    what: draft.what || draft.action || draft.title,
    who: draft.who || (draft.person ? draft.person : "user"),
    when: draft.when || [due, time].filter(Boolean).join(" · ") || undefined,
    where: draft.where || undefined,
    how: draft.how || undefined,
    owner: draft.who && draft.who !== "user" ? ("other" as const) : ("me" as const),
    reminder: reminderPlan
      ? {
          shouldRemind: Boolean(reminderPlan.shouldRemind),
          strategy: reminderPlan.strategy,
          offsetMinutes: reminderPlan.offsetMinutes ?? null,
          reason: reminderPlan.reason || undefined,
          message: reminderPlan.message || undefined,
        }
      : undefined,
    typoCorrected:
      Boolean(draft.normalizedText) &&
      Boolean(draft.quote) &&
      draft.normalizedText!.trim().toLowerCase() !== draft.quote.trim().toLowerCase(),
    ambiguity: draft.missingFields || [],
  };
  const item: Item = {
    id: newId("ai"),
    title: draft.title || draft.what || "",
    description: draft.action || undefined,
    semanticContext,
    kind: draft.kind,
    status: needsClarification ? "inbox" : "open",
    priority: draft.priority,
    ...(due ? { due } : {}),
    ...(time ? { time } : {}),
    ...(draft.kind === "waiting" ? { since: todayISO() } : {}),
    ...(person ? { personId: person.id } : {}),
    ...(relatedPersonName ? { personName: relatedPersonName } : {}),
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
    reminderTime: reminderEnabled
      ? defaultReminderTime(due, time, reminderPlan?.offsetMinutes)
      : undefined,
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
  const raw = text.trim();
  if (!raw) return null;
  const normalized = normalizeCasualIndonesian(raw);
  const lower = normalized.toLowerCase();
  if (/\?$/.test(raw) || /^(apa|siapa|kapan|dimana|kenapa|gimana|bagaimana|what|who|when|where|why|how)\b/i.test(lower)) {
    return null;
  }

  const parsed = parseSmartDate(normalized);
  const explicitObligation =
    /\b(harus|perlu|mesti|wajib|jangan\s+lupa|tolong\s+ingat|tolong\s+ingetin|ingatkan|remind|need\s+to|have\s+to|must)\b/i.test(
      lower,
    );
  const futureIntent =
    /\b(?:saya|aku|gue|gw)\s+(?:mau|akan)\b/i.test(lower) &&
    Boolean(parsed.date || parsed.time);
  if (!explicitObligation && !futureIntent) return null;
  const title = normalizeActionTitle(normalized);
  const where = inferLocation(normalized);
  const how = inferMethod(normalized);
  const relatedPersonName = inferRelatedPerson(normalized);
  const relatedPerson = matchPerson(ctx.people, relatedPersonName);
  const reminderPlan = fallbackReminderPlan(title, normalized, parsed.date ?? undefined, parsed.time ?? undefined);
  const when = [
    parsed.date || (/\bbesok\b/i.test(normalized) ? "besok" : undefined),
    parsed.time || undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: newId("chat"),
    title: title || normalized,
    kind: "task",
    status: "open",
    priority: "medium",
    ...(parsed.date ? { due: parsed.date } : {}),
    ...(parsed.time ? { time: parsed.time } : {}),
    semanticContext: {
      normalizedText: normalized,
      what: title || normalized,
      who: "user",
      when: when || undefined,
      where,
      how,
      owner: "me",
      reminder: reminderPlan,
      typoCorrected: normalized.toLowerCase() !== raw.toLowerCase(),
    },
    ...(relatedPerson ? { personId: relatedPerson.id } : {}),
    ...(relatedPersonName ? { personName: relatedPersonName } : {}),
    source: "Chat dengan NANTI",
    sourceType: "chat",
    quote: raw,
    aiNote: "Dibuat dari pesan chat yang berisi tindakan eksplisit; typo dan singkatan dinormalisasi.",
    confidence: parsed.date || parsed.time ? 0.9 : 0.76,
    memoryStrength: 1,
    createdBy: "ai",
    createdAt: new Date().toISOString(),
    reminderEnabled: Boolean(parsed.date || parsed.time),
    reminderTime: parsed.date
      ? defaultReminderTime(parsed.date, parsed.time ?? undefined, reminderPlan?.offsetMinutes)
      : undefined,
    reminderChannels: parsed.date || parsed.time ? ["in_app", "push"] : [],
    reminderIntensity: "normal",
  };
}


/**
 * Deterministic fallback for one or more explicit future actions.
 * This path is intentionally conservative so Ask NANTI can still save clear
 * commitments when the AI provider is temporarily unavailable.
 */
export function chatMessageToFallbackItems(
  text: string,
  ctx: { people: Person[]; projects: Project[] },
): Item[] {
  const raw = text.trim();
  if (!raw) return [];

  const normalized = normalizeCasualIndonesian(raw);
  if (/\?$/.test(raw)) return [];

  const multi =
    /^(?:(?:saya|aku|gue|gw)\s+)?(?:(?:mau|akan|harus|perlu|mesti|wajib)\s+)?(.+?)\s+(hari\s+ini|besok|lusa)\s+(?:jam|pukul)\s+(\d{1,2}(?:[.:]\d{2})?(?:\s*(?:pagi|siang|sore|malam))?)\s+(?:dan|,)\s+(?:jam|pukul)\s+(\d{1,2}(?:[.:]\d{2})?(?:\s*(?:pagi|siang|sore|malam))?)\s+(.+)$/i.exec(
      normalized,
    );

  if (multi) {
    const firstAction = multi[1]!.trim();
    const sharedDate = multi[2]!.trim();
    const firstTime = multi[3]!.trim();
    const secondTime = multi[4]!.trim();
    const secondAction = multi[5]!.trim();

    const first = chatMessageToFallbackItem(
      `saya harus ${firstAction} ${sharedDate} jam ${firstTime}`,
      ctx,
    );
    const second = chatMessageToFallbackItem(
      `saya harus ${secondAction} ${sharedDate} jam ${secondTime}`,
      ctx,
    );

    return [first, second]
      .filter((item): item is Item => Boolean(item))
      .map((item) => ({
        ...item,
        quote: raw,
        source: "Chat dengan NANTI",
      }));
  }

  const single = chatMessageToFallbackItem(raw, ctx);
  return single ? [single] : [];
}
