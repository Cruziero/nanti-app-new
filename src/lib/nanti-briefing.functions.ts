import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type BriefingItem = {
  id: string;
  title: string;
  priority?: string | null;
  due_date?: string | null;
  time?: string | null;
  person_name?: string | null;
  project_name?: string | null;
  updated_at?: string | null;
};

type WaitingItem = {
  id: string;
  title: string;
  person_name?: string | null;
  follow_up_at?: string | null;
  started_at?: string | null;
  updated_at?: string | null;
};

function jakartaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function jakartaHour(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
}

function dayDiff(date?: string | null, today = jakartaDate()) {
  if (!date) return undefined;
  const normalized = String(date).slice(0, 10);
  const from = Date.parse(`${today}T00:00:00Z`);
  const to = Date.parse(`${normalized}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return undefined;
  return Math.round((to - from) / 86_400_000);
}

function simpleFingerprint(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

function priorityRank(priority?: string | null) {
  return priority === "urgent" ? 4 : priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

function fallbackSummary(args: {
  overdue: number;
  dueToday: number;
  waitingDue: number;
  inbox: number;
}) {
  const parts: string[] = [];
  if (args.overdue) parts.push(`${args.overdue} overdue`);
  if (args.dueToday) parts.push(`${args.dueToday} due today`);
  if (args.waitingDue) parts.push(`${args.waitingDue} follow-up`);
  if (args.inbox) parts.push(`${args.inbox} need clarification`);
  return parts.length
    ? `Focus on ${parts.join(", ")}. NANTI has ordered the most important items below.`
    : "Nothing urgent is pressing right now. Use the space to move one important project forward.";
}

export const fetchDailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ force: z.boolean().optional().default(false) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const now = new Date();
    const today = jakartaDate(now);

    const [
      { data: tasks, error: taskError },
      { data: waiting, error: waitingError },
      { data: inbox, error: inboxError },
      { data: settingsRow, error: settingsError },
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("id,title,priority,due_date,time,person_name,project_name,updated_at")
        .eq("user_id", userId)
        .eq("status", "pending"),
      supabase
        .from("waiting_items")
        .select("id,title,person_name,follow_up_at,started_at,updated_at")
        .eq("user_id", userId)
        .in("status", ["waiting", "snoozed"]),
      supabase
        .from("inbox_items")
        .select("id,title,clarification_question,updated_at")
        .eq("user_id", userId)
        .eq("status", "pending"),
      supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (taskError) throw taskError;
    if (waitingError) throw waitingError;
    if (inboxError) throw inboxError;
    if (settingsError) throw settingsError;

    const taskRows = (tasks || []) as BriefingItem[];
    const waitingRows = (waiting || []) as WaitingItem[];
    const inboxRows = (inbox || []) as Array<Record<string, unknown>>;

    const fingerprintPayload = JSON.stringify({
      tasks: taskRows.map((item) => [item.id, item.updated_at]),
      waiting: waitingRows.map((item) => [item.id, item.updated_at]),
      inbox: inboxRows.map((item) => [item.id, item.updated_at]),
    });
    const fingerprint = simpleFingerprint(fingerprintPayload);

    if (!data.force) {
      const { data: cached, error: cachedError } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("user_id", userId)
        .eq("brief_date", today)
        .maybeSingle();
      if (cachedError) throw cachedError;
      if (cached?.fingerprint === fingerprint) return cached;
    }

    const overdue = taskRows.filter((item) => {
      const diff = dayDiff(item.due_date, today);
      return diff !== undefined && diff < 0;
    });
    const dueToday = taskRows.filter((item) => dayDiff(item.due_date, today) === 0);
    const waitingDue = waitingRows.filter((item) => {
      if (item.follow_up_at) return new Date(item.follow_up_at).getTime() <= now.getTime();
      const diff = dayDiff(item.started_at, today);
      return diff !== undefined && diff <= -2;
    });

    const priorities = [...taskRows]
      .sort((a, b) => {
        const aDiff = dayDiff(a.due_date, today);
        const bDiff = dayDiff(b.due_date, today);
        const aUrgency = aDiff === undefined ? 999 : aDiff;
        const bUrgency = bDiff === undefined ? 999 : bDiff;
        if (aUrgency !== bUrgency) return aUrgency - bUrgency;
        return priorityRank(b.priority) - priorityRank(a.priority);
      })
      .slice(0, 5)
      .map((item) => {
        const diff = dayDiff(item.due_date, today);
        const timing =
          diff === undefined
            ? "no date"
            : diff < 0
              ? `${Math.abs(diff)}d overdue`
              : diff === 0
                ? "today"
                : `in ${diff}d`;
        const contextText = item.person_name || item.project_name;
        return `${item.title} · ${timing}${contextText ? ` · ${contextText}` : ""}`;
      });

    const waitingList = waitingDue.slice(0, 5).map((item) => {
      const person = item.person_name ? ` · ${item.person_name}` : "";
      return `${item.title}${person}`;
    });

    const inboxList = inboxRows.slice(0, 5).map((item) => {
      const question =
        typeof item.clarification_question === "string" ? item.clarification_question : "";
      return `${String(item.title || "Unclear item")}${question ? ` · ${question}` : ""}`;
    });

    const settings = (settingsRow?.settings || {}) as Record<string, unknown>;
    const name =
      (typeof settings.preferredName === "string" && settings.preferredName) ||
      (typeof settings.name === "string" && settings.name) ||
      "";
    const hour = jakartaHour(now);
    const greeting =
      hour < 11
        ? `Good morning${name ? `, ${name}` : ""}.`
        : hour < 15
          ? `Good afternoon${name ? `, ${name}` : ""}.`
          : `Good evening${name ? `, ${name}` : ""}.`;

    const stats = {
      totalTasks: taskRows.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      waiting: waitingRows.length,
      waitingDue: waitingDue.length,
      inbox: inboxRows.length,
    };

    let summary = fallbackSummary({
      overdue: overdue.length,
      dueToday: dueToday.length,
      waitingDue: waitingDue.length,
      inbox: inboxRows.length,
    });

    try {
      const { askNanti } = await import("./nanti-ai.server");
      const contextText = [
        `Today: ${today}`,
        `Stats: ${JSON.stringify(stats)}`,
        `Priorities: ${priorities.join(" | ") || "none"}`,
        `Waiting follow-ups: ${waitingList.join(" | ") || "none"}`,
        `Needs clarification: ${inboxList.join(" | ") || "none"}`,
      ].join("\n");
      summary = await askNanti(
        "Give me a morning chief-of-staff briefing in 2-3 short sentences. Lead with the single most important risk or commitment. Do not repeat every item.",
        contextText,
      );
    } catch (error) {
      console.error("Daily briefing AI summary failed; using deterministic fallback:", error);
    }

    const { data: briefing, error: upsertError } = await supabase
      .from("daily_briefings")
      .upsert(
        {
          user_id: userId,
          brief_date: today,
          greeting,
          summary,
          stats,
          priorities,
          waiting: waitingList,
          inbox: inboxList,
          fingerprint,
          generated_at: now.toISOString(),
        },
        { onConflict: "user_id,brief_date" },
      )
      .select("*")
      .single();
    if (upsertError) throw upsertError;

    await supabase.from("product_events").insert({
      user_id: userId,
      event_name: data.force ? "daily_briefing_refreshed" : "daily_briefing_generated",
      source: "today",
      properties: { ...stats, fingerprint },
    });

    return briefing;
  });
