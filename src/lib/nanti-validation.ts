import type { StructuredExtraction, ClarificationRequest, ItemKind, Priority } from "./nanti-types";
import { parseSmartDate } from "./nanti-dates";

const REQUIRED_FIELDS_BY_KIND: Record<ItemKind, string[]> = {
  commitment: ["what", "who", "when"],
  task: ["what"],
  deadline: ["what", "when"],
  waiting: ["what", "who"],
  followup: ["what"],
  invoice: ["what", "who"],
};

export function validateExtraction(extraction: StructuredExtraction): {
  valid: boolean;
  clarification?: ClarificationRequest;
} {
  const required = REQUIRED_FIELDS_BY_KIND[extraction.type] || ["what"];
  const missing: string[] = [];

  for (const field of required) {
    switch (field) {
      case "what":
        if (!extraction.what || extraction.what.trim().length < 3) missing.push("what");
        break;
      case "who":
        if (!extraction.person || extraction.person.trim().length < 2) missing.push("who");
        break;
      case "when":
        if (!extraction.whenParsed) missing.push("when");
        break;
    }
  }

  if (missing.length === 0) {
    return { valid: true };
  }

  // Build clarification request
  const primaryMissing = missing[0]!;
  let question = "";
  let options: { label: string; value: string }[] | undefined;

  switch (primaryMissing) {
    case "when":
      question = "Kapan harus selesai atau diingatkan?";
      options = [
        { label: "Hari ini", value: "hari ini" },
        { label: "Besok", value: "besok" },
        { label: "Minggu ini", value: "minggu ini" },
        { label: "Pilih tanggal", value: "custom_date" },
        { label: "Tanpa tenggat", value: "no_date" },
      ];
      break;
    case "who":
      question = "Untuk siapa atau dengan siapa?";
      options = [
        { label: "Pilih dari kontak", value: "pick_contact" },
        { label: "Ketik nama", value: "type_name" },
      ];
      break;
    case "what":
      question = "Apa yang perlu diingat?";
      break;
  }

  return {
    valid: false,
    clarification: {
      type: primaryMissing as "date" | "person" | "what",
      question,
      options,
      extracted: extraction,
      originalText: extraction.sourceQuote,
    },
  };
}

export function buildExtractionFromAI(raw: {
  type?: string;
  title?: string;
  person?: string | null;
  org?: string | null;
  what?: string;
  when?: string | null;
  whenParsed?: string | null;
  action?: string;
  owner?: string;
  priority?: string;
  context?: string;
  reminderRequired?: boolean;
  confidence?: number;
  needsClarification?: boolean;
  missingFields?: string[];
  sourceQuote?: string;
  project?: string | null;
  dueTime?: string;
  amount?: number;
  currency?: string;
}): StructuredExtraction {
  // Parse the "when" field if it's natural language
  let whenParsed = raw.whenParsed || null;
  if (raw.when && !whenParsed) {
    const parsed = parseSmartDate(raw.when);
    whenParsed = parsed.date;
  }

  const kindMap: Record<string, ItemKind> = {
    task: "task",
    commitment: "commitment",
    deadline: "deadline",
    waiting: "waiting",
    followup: "followup",
    invoice: "invoice",
  };

  const priorityMap: Record<string, Priority> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  };

  return {
    type: kindMap[raw.type || "task"] || "task",
    title: raw.title || raw.what || "",
    person: raw.person ?? null,
    org: raw.org ?? null,
    what: raw.what || raw.title || "",
    when: raw.when ?? null,
    whenParsed,
    action: raw.action || raw.what || raw.title || "",
    owner: (raw.owner as "me" | "other" | "unknown") || "unknown",
    priority: priorityMap[raw.priority || "medium"] || "medium",
    context: raw.context || "",
    reminderRequired: raw.reminderRequired ?? true,
    confidence: typeof raw.confidence === "number" ? Math.min(1, Math.max(0, raw.confidence)) : 0.8,
    needsClarification: raw.needsClarification ?? false,
    missingFields: raw.missingFields || [],
    sourceQuote: raw.sourceQuote || "",
    project: raw.project ?? null,
    dueTime: raw.dueTime,
    amount: raw.amount,
    currency: raw.currency,
  };
}
