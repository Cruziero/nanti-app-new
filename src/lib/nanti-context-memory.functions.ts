import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizedIntentText } from "./nanti-language";

export type EntityAliasRow = {
  id: string;
  entity_type: "person" | "project" | "location";
  person_id?: string | null;
  project_id?: string | null;
  canonical_name: string;
  alias_text: string;
  metadata: Record<string, unknown>;
  confidence: number;
  evidence_count: number;
  active: boolean;
  source?: string | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export type UserRoutineRow = {
  id: string;
  routine_type: "action" | "schedule" | "location" | "workflow" | "reminder";
  routine_key: string;
  title: string;
  learned_value: Record<string, unknown>;
  example_text?: string | null;
  source_item_id?: string | null;
  confidence: number;
  evidence_count: number;
  active: boolean;
  last_observed_at: string;
  created_at: string;
  updated_at: string;
};

export const fetchEntityAliases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("entity_aliases")
      .select(
        "id,entity_type,person_id,project_id,canonical_name,alias_text,metadata,confidence,evidence_count,active,source,last_seen_at,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("active", { ascending: false })
      .order("confidence", { ascending: false })
      .order("evidence_count", { ascending: false })
      .limit(150);
    if (error) throw error;
    return (data || []) as EntityAliasRow[];
  });

export const fetchUserRoutines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("user_routines")
      .select(
        "id,routine_type,routine_key,title,learned_value,example_text,source_item_id,confidence,evidence_count,active,last_observed_at,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("active", { ascending: false })
      .order("evidence_count", { ascending: false })
      .order("confidence", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []) as UserRoutineRow[];
  });

export const recordEntityAlias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      entity_type: z.enum(["person", "project", "location"]),
      entity_id: z.string().uuid().optional().nullable(),
      canonical_name: z.string().min(1).max(500),
      alias_text: z.string().min(1).max(1000),
      metadata: z.record(z.unknown()).optional().default({}),
      confidence: z.number().min(0).max(1).optional().default(0.78),
      source: z.string().max(200).optional().nullable(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let entityId = data.entity_id ?? null;
    let canonicalName = data.canonical_name.trim();

    if (data.entity_type === "person" && !entityId) {
      const { data: person, error } = await supabase.rpc("resolve_person_memory", {
        p_name: canonicalName,
        p_company: null,
      });
      if (error) throw error;
      const row = Array.isArray(person) ? person[0] : person;
      if (!row?.id) throw new Error("Person could not be resolved.");
      entityId = row.id;
      canonicalName = row.name || canonicalName;
    } else if (data.entity_type === "project" && !entityId) {
      const { data: project, error } = await supabase.rpc("resolve_project_memory", {
        p_name: canonicalName,
      });
      if (error) throw error;
      const row = Array.isArray(project) ? project[0] : project;
      if (!row?.id) throw new Error("Project could not be resolved.");
      entityId = row.id;
      canonicalName = row.name || canonicalName;
    }

    const { data: alias, error } = await supabase.rpc("record_entity_alias", {
      p_entity_type: data.entity_type,
      p_entity_id: data.entity_type === "location" ? null : entityId,
      p_canonical_name: canonicalName,
      p_alias_text: data.alias_text,
      p_metadata: data.metadata,
      p_confidence: data.confidence,
      p_source: data.source ?? null,
    });
    if (error) throw error;
    const row = Array.isArray(alias) ? alias[0] : alias;
    if (!row) throw new Error("Alias could not be saved.");
    return row as EntityAliasRow;
  });

export const observeUserRoutine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      source_item_id: z.string().uuid().optional().nullable(),
      what: z.string().min(1).max(500),
      where: z.string().max(300).optional().nullable(),
      how: z.string().max(300).optional().nullable(),
      time: z.string().max(20).optional().nullable(),
      person: z.string().max(200).optional().nullable(),
      project: z.string().max(200).optional().nullable(),
      reminder_offset_minutes: z.number().min(0).max(43200).optional().nullable(),
      example_text: z.string().max(3000).optional().nullable(),
      explicit_recurrence: z.boolean().optional().default(false),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const normalizedWhat = normalizedIntentText(data.what).slice(0, 260);
    const normalizedWhere = data.where ? normalizedIntentText(data.where).slice(0, 160) : "";
    const normalizedPerson = data.person ? normalizedIntentText(data.person).slice(0, 120) : "";
    const normalizedProject = data.project ? normalizedIntentText(data.project).slice(0, 120) : "";
    const key = [
      "action",
      normalizedWhat,
      normalizedWhere ? `where:${normalizedWhere}` : "",
      data.time ? `time:${data.time}` : "",
      normalizedPerson ? `person:${normalizedPerson}` : "",
      normalizedProject ? `project:${normalizedProject}` : "",
    ].filter(Boolean).join("|");

    const learnedValue = {
      what: data.what,
      ...(data.where ? { where: data.where } : {}),
      ...(data.how ? { how: data.how } : {}),
      ...(data.time ? { time: data.time } : {}),
      ...(data.person ? { person: data.person } : {}),
      ...(data.project ? { project: data.project } : {}),
      ...(data.reminder_offset_minutes != null
        ? { reminderOffsetMinutes: data.reminder_offset_minutes }
        : {}),
    };

    const { data: routine, error } = await supabase.rpc("record_user_routine", {
      p_routine_type: "action",
      p_routine_key: key,
      p_title: data.what,
      p_learned_value: learnedValue,
      p_example_text: data.example_text ?? null,
      p_source_item_id: data.source_item_id ?? null,
      p_confidence: data.explicit_recurrence ? 0.9 : 0.55,
    });
    if (error) throw error;

    if (data.where) {
      const { error: locationError } = await supabase.rpc("record_entity_alias", {
        p_entity_type: "location",
        p_entity_id: null,
        p_canonical_name: data.where,
        p_alias_text: data.where,
        p_metadata: { observed_from_routine: true },
        p_confidence: data.explicit_recurrence ? 0.88 : 0.62,
        p_source: "routine_observation",
      });
      if (locationError) console.error("Failed to observe location memory:", locationError);
    }

    const row = Array.isArray(routine) ? routine[0] : routine;
    return row as UserRoutineRow;
  });

export const setEntityAliasActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: row, error } = await supabase
      .from("entity_aliases")
      .update({ active: data.active, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return row as EntityAliasRow;
  });

export const deleteEntityAlias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: row, error } = await supabase
      .from("entity_aliases")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const setUserRoutineActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: row, error } = await supabase
      .from("user_routines")
      .update({ active: data.active, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return row as UserRoutineRow;
  });

export const deleteUserRoutine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: row, error } = await supabase
      .from("user_routines")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export async function loadEntityRoutinePrompt(
  supabase: any,
  userId: string,
) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [
    peopleResult,
    projectsResult,
    aliasesResult,
    routinesResult,
    activityResult,
    calendarResult,
  ] = await Promise.all([
      supabase
        .from("people")
        .select("id,name,company,role,last_conversation_at")
        .eq("user_id", userId)
        .order("last_conversation_at", { ascending: false })
        .limit(60),
      supabase
        .from("projects")
        .select("id,name,description,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(40),
      supabase
        .from("entity_aliases")
        .select(
          "entity_type,person_id,project_id,canonical_name,alias_text,metadata,confidence,evidence_count",
        )
        .eq("user_id", userId)
        .eq("active", true)
        .order("confidence", { ascending: false })
        .order("evidence_count", { ascending: false })
        .limit(100),
      supabase
        .from("user_routines")
        .select("routine_type,title,learned_value,confidence,evidence_count,last_observed_at")
        .eq("user_id", userId)
        .eq("active", true)
        .or("evidence_count.gte.2,confidence.gte.0.85")
        .order("evidence_count", { ascending: false })
        .order("confidence", { ascending: false })
        .limit(30),
      supabase
        .from("person_activity")
        .select("person_id,summary,occurred_at")
        .eq("user_id", userId)
        .order("occurred_at", { ascending: false })
        .limit(80),
      supabase
        .from("calendar_events")
        .select("title,start_date,end_date,location,attendees")
        .eq("user_id", userId)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(30),
    ]);

  const errors = [
    peopleResult.error,
    projectsResult.error,
    aliasesResult.error,
    routinesResult.error,
    activityResult.error,
    calendarResult.error,
  ].filter(Boolean);
  if (errors.length) {
    console.error("Failed to load some entity/routine memory:", errors);
  }

  const people = peopleResult.data || [];
  const projects = projectsResult.data || [];
  const aliases = aliasesResult.data || [];
  const routines = routinesResult.data || [];
  const activity = activityResult.data || [];
  const calendarEvents = calendarResult.data || [];

  if (
    !people.length &&
    !projects.length &&
    !aliases.length &&
    !routines.length &&
    !calendarEvents.length
  ) {
    return "";
  }

  const personAliases = new Map<string, string[]>();
  const projectAliases = new Map<string, string[]>();
  const locations: string[] = [];
  for (const alias of aliases) {
    if (alias.entity_type === "person" && alias.person_id) {
      personAliases.set(alias.person_id, [
        ...(personAliases.get(alias.person_id) || []),
        alias.alias_text,
      ]);
    } else if (alias.entity_type === "project" && alias.project_id) {
      projectAliases.set(alias.project_id, [
        ...(projectAliases.get(alias.project_id) || []),
        alias.alias_text,
      ]);
    } else if (alias.entity_type === "location") {
      locations.push(
        alias.alias_text === alias.canonical_name
          ? alias.canonical_name
          : `${alias.alias_text} → ${alias.canonical_name}`,
      );
    }
  }

  const recentByPerson = new Map<string, string[]>();
  for (const event of activity) {
    if (!event.person_id) continue;
    const existing = recentByPerson.get(event.person_id) || [];
    if (existing.length < 3) existing.push(`${event.occurred_at}: ${event.summary}`);
    recentByPerson.set(event.person_id, existing);
  }

  const lines: string[] = [
    "ENTITY & ROUTINE MEMORY FOR THIS USER:",
    "Use this only to resolve references when evidence is strong. Current explicit wording wins.",
    "Never merge two people/projects merely because names are similar. If multiple candidates fit, ask one clarification.",
    "Indirect phrases like 'orang procurement itu' may resolve from role/company + recent activity. Do not invent identity.",
  ];

  if (people.length) {
    lines.push("PEOPLE:");
    for (const person of people) {
      const descriptors = [
        person.company ? `company=${person.company}` : "",
        person.role ? `role=${person.role}` : "",
        personAliases.get(person.id)?.length
          ? `aliases=${personAliases.get(person.id)!.slice(0, 8).join(", ")}`
          : "",
        recentByPerson.get(person.id)?.length
          ? `recent=${recentByPerson.get(person.id)!.join(" | ")}`
          : "",
      ].filter(Boolean);
      lines.push(`- ${person.name}${descriptors.length ? ` · ${descriptors.join(" · ")}` : ""}`);
    }
  }

  if (projects.length) {
    lines.push("PROJECTS:");
    for (const project of projects) {
      const descriptors = [
        projectAliases.get(project.id)?.length
          ? `aliases=${projectAliases.get(project.id)!.slice(0, 8).join(", ")}`
          : "",
        project.description ? `context=${String(project.description).slice(0, 240)}` : "",
      ].filter(Boolean);
      lines.push(`- ${project.name}${descriptors.length ? ` · ${descriptors.join(" · ")}` : ""}`);
    }
  }

  if (locations.length) {
    lines.push("KNOWN LOCATIONS:");
    for (const location of [...new Set(locations)].slice(0, 30)) lines.push(`- ${location}`);
  }

  if (calendarEvents.length) {
    lines.push("UPCOMING GOOGLE CALENDAR:");
    lines.push(
      "Calendar events are schedule facts, not tasks. Use them to answer schedule questions and avoid inventing free time.",
    );
    for (const event of calendarEvents) {
      const details = [
        event.start_date ? `start=${event.start_date}` : "",
        event.end_date ? `end=${event.end_date}` : "",
        event.location ? `location=${event.location}` : "",
        Array.isArray(event.attendees) && event.attendees.length
          ? `attendees=${event.attendees.slice(0, 8).join(", ")}`
          : "",
      ].filter(Boolean);
      lines.push(
        `- ${event.title || "Untitled event"}${details.length ? ` · ${details.join(" · ")}` : ""}`,
      );
    }
  }

  if (routines.length) {
    lines.push("RECURRING ROUTINES (evidence, not commands):");
    lines.push(
      "Use routines to interpret omitted context or suggest reminders, but do not create a task solely because a routine exists.",
    );
    for (const routine of routines) {
      lines.push(
        `- ${routine.title} => ${JSON.stringify(routine.learned_value || {}).slice(0, 700)} (evidence ${routine.evidence_count}, confidence ${Number(routine.confidence || 0).toFixed(2)})`,
      );
    }
  }

  return lines.join("\n").slice(0, 18000);
}
