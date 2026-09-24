import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


type MemoryRefInput = {
  person_id?: string | null;
  person_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
};

async function resolveMemoryRefs(supabase: any, input: MemoryRefInput) {
  const resolved: MemoryRefInput = {};

  if (input.person_id !== undefined) {
    resolved.person_id = input.person_id;
    if (input.person_name !== undefined) resolved.person_name = input.person_name;
  } else if (input.person_name === null) {
    resolved.person_id = null;
    resolved.person_name = null;
  } else if (input.person_name?.trim()) {
    const { data: person, error } = await supabase.rpc("resolve_person_memory", {
      p_name: input.person_name.trim(),
      p_company: null,
    });
    if (error) throw error;
    const row = Array.isArray(person) ? person[0] : person;
    if (!row?.id) throw new Error("Person memory could not be resolved.");
    resolved.person_id = row.id;
    resolved.person_name = row.name || input.person_name.trim();
  }

  if (input.project_id !== undefined) {
    resolved.project_id = input.project_id;
    if (input.project_name !== undefined) resolved.project_name = input.project_name;
  } else if (input.project_name === null) {
    resolved.project_id = null;
    resolved.project_name = null;
  } else if (input.project_name?.trim()) {
    const { data: project, error } = await supabase.rpc("resolve_project_memory", {
      p_name: input.project_name.trim(),
    });
    if (error) throw error;
    const row = Array.isArray(project) ? project[0] : project;
    if (!row?.id) throw new Error("Project memory could not be resolved.");
    resolved.project_id = row.id;
    resolved.project_name = row.name || input.project_name.trim();
  }

  return resolved;
}

async function recordTaskPersonMemory(
  supabase: any,
  input: {
    userId: string;
    personId?: string | null;
    itemId: string;
    title: string;
    eventType?: "captured" | "note";
    dedupePrefix?: string;
    source?: string | null;
  },
) {
  if (!input.personId) return;

  const occurredAt = new Date().toISOString();
  const eventType = input.eventType || "captured";
  const dedupeKey =
    eventType === "captured"
      ? `capture:${input.itemId}`
      : `${input.dedupePrefix || eventType}:${input.itemId}:${input.personId}`;
  const { error } = await supabase.from("person_activity").insert({
    user_id: input.userId,
    person_id: input.personId,
    event_type: eventType,
    item_id: input.itemId,
    summary:
      eventType === "captured"
        ? `Captured: ${input.title}`
        : `Associated with task: ${input.title}`,
    source: input.source || "NANTI",
    occurred_at: occurredAt,
    dedupe_key: dedupeKey,
    metadata: { automatic: true },
  });

  if (error && (error as { code?: string }).code !== "23505") throw error;

  const { error: personError } = await supabase
    .from("people")
    .update({
      last_conversation_at: occurredAt,
      updated_at: occurredAt,
    })
    .eq("id", input.personId)
    .eq("user_id", input.userId);
  if (personError) throw personError;
}

// Projects
export const fetchProjects = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { userId, supabase } = context;
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        color: z.string().max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return project;
  });

export const updateProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        color: z.string().max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deleteProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

// People
export const fetchPeople = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { userId, supabase } = context;
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createPerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().min(1).max(200),
        company: z.string().max(200).optional(),
        role: z.string().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: person, error } = await supabase
      .from("people")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return person;
  });

export const updatePerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        company: z.string().max(200).optional(),
        role: z.string().max(200).optional(),
        last_conversation_at: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("people")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deletePerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const resolvePersonMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      name: z.string().min(1).max(200),
      company: z.string().max(200).optional().nullable(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: person, error } = await supabase.rpc("resolve_person_memory", {
      p_name: data.name,
      p_company: data.company ?? null,
    });
    if (error) throw error;
    const row = Array.isArray(person) ? person[0] : person;
    if (!row) throw new Error("Person memory could not be resolved.");
    return row as Record<string, unknown>;
  });

export const resolveProjectMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ name: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: project, error } = await supabase.rpc("resolve_project_memory", {
      p_name: data.name,
    });
    if (error) throw error;
    const row = Array.isArray(project) ? project[0] : project;
    if (!row) throw new Error("Project memory could not be resolved.");
    return row as Record<string, unknown>;
  });

export const fetchPersonActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("person_activity")
      .select("id,person_id,event_type,item_id,conversation_id,summary,source,occurred_at,metadata")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return data;
  });

export const logPersonActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      person_id: z.string().uuid(),
      event_type: z.enum(["captured", "completed", "followed_up", "received", "conversation", "note"]),
      item_id: z.string().uuid().optional().nullable(),
      conversation_id: z.string().uuid().optional().nullable(),
      summary: z.string().min(1).max(1000),
      source: z.string().max(200).optional().nullable(),
      occurred_at: z.string().optional(),
      dedupe_key: z.string().max(300).optional().nullable(),
      metadata: z.record(z.unknown()).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const occurredAt = data.occurred_at || new Date().toISOString();
    const { data: activity, error } = await supabase
      .from("person_activity")
      .insert({
        user_id: userId,
        person_id: data.person_id,
        event_type: data.event_type,
        item_id: data.item_id ?? null,
        conversation_id: data.conversation_id ?? null,
        summary: data.summary,
        source: data.source ?? null,
        occurred_at: occurredAt,
        dedupe_key: data.dedupe_key ?? null,
        metadata: data.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) {
      if ((error as { code?: string }).code === "23505") return null;
      throw error;
    }

    if (["captured", "followed_up", "received", "conversation"].includes(data.event_type)) {
      const { error: personError } = await supabase
        .from("people")
        .update({ last_conversation_at: occurredAt, updated_at: new Date().toISOString() })
        .eq("id", data.person_id)
        .eq("user_id", userId);
      if (personError) throw personError;
    }

    return activity;
  });

// Tasks
export const fetchTasks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { userId, supabase } = context;
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1).max(500),
        description: z.string().max(2000).optional(),
        type: z.enum(["task", "commitment", "deadline", "waiting", "followup"]),
        status: z.enum(["pending", "completed", "dismissed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        due_date: z.string().optional(),
        project_id: z.string().uuid().optional(),
        person_id: z.string().uuid().optional(),
        conversation_id: z.string().uuid().optional(),
        source: z.string().max(200).optional(),
        quote: z.string().max(2000).optional(),
        ai_note: z.string().max(2000).optional(),
        confidence: z.number().optional(),
        source_type: z.enum(["paste", "screenshot", "chat", "demo", "manual", "whatsapp", "calendar"]).optional(),
        time: z.string().max(20).optional(),
        person_name: z.string().max(200).optional(),
        project_name: z.string().max(200).optional(),
        reminder_enabled: z.boolean().optional(),
        reminder_time: z.string().optional().nullable(),
        reminder_channels: z.array(z.enum(["whatsapp", "push", "calendar", "in_app"])).optional(),
        reminder_intensity: z.enum(["gentle", "normal", "persistent"]).optional().nullable(),
        semantic_context: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const memoryRefs = await resolveMemoryRefs(supabase, data);
    const payload = { ...data, ...memoryRefs, user_id: userId };
    const { data: task, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    await recordTaskPersonMemory(supabase, {
      userId,
      personId: task.person_id,
      itemId: task.id,
      title: task.title,
      source: task.source,
    });
    return task;
  });

export const updateTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(2000).optional(),
        type: z.enum(["task", "commitment", "deadline", "waiting", "followup"]).optional(),
        status: z.enum(["pending", "completed", "dismissed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        due_date: z.string().optional(),
        project_id: z.string().uuid().optional().nullable(),
        person_id: z.string().uuid().optional().nullable(),
        time: z.string().max(20).optional().nullable(),
        person_name: z.string().max(200).optional().nullable(),
        project_name: z.string().max(200).optional().nullable(),
        reminder_enabled: z.boolean().optional(),
        reminder_time: z.string().optional().nullable(),
        reminder_channels: z.array(z.enum(["whatsapp", "push", "calendar", "in_app"])).optional(),
        reminder_intensity: z.enum(["gentle", "normal", "persistent"]).optional().nullable(),
        semantic_context: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { id, ...updates } = data;
    const memoryRefs = await resolveMemoryRefs(supabase, updates);
    const { data: task, error } = await supabase
      .from("tasks")
      .update({ ...updates, ...memoryRefs, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;

    if (memoryRefs.person_id) {
      await recordTaskPersonMemory(supabase, {
        userId,
        personId: memoryRefs.person_id,
        itemId: task.id,
        title: task.title,
        eventType: "note",
        dedupePrefix: "person_assignment",
        source: task.source,
      });
    }
    return task;
  });

export const deleteTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { error } = await supabase.from("tasks").delete().eq("id", data.id).eq("user_id", userId).select("id").single();
    if (error) throw error;
  });

// Waiting Items
export const fetchWaitingItems = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { userId, supabase } = context;
  const { data, error } = await supabase
    .from("waiting_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createWaitingItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1).max(500),
        person_id: z.string().uuid().optional(),
        project_id: z.string().uuid().optional(),
        status: z.enum(["waiting", "received", "snoozed"]).optional(),
        started_at: z.string().optional(),
        days_warning_threshold: z.number().optional(),
        person_name: z.string().max(200).optional(),
        project_name: z.string().max(200).optional(),
        source: z.string().max(200).optional(),
        quote: z.string().max(2000).optional(),
        ai_note: z.string().max(2000).optional(),
        confidence: z.number().min(0).max(1).optional(),
        source_type: z.enum(["paste", "screenshot", "chat", "demo", "manual", "whatsapp", "calendar"]).optional(),
        conversation_id: z.string().uuid().optional(),
        follow_up_at: z.string().optional().nullable(),
        last_followed_up_at: z.string().optional().nullable(),
        follow_up_count: z.number().int().min(0).optional(),
        auto_follow_up_enabled: z.boolean().optional(),
        semantic_context: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const memoryRefs = await resolveMemoryRefs(supabase, data);
    const payload = { ...data, ...memoryRefs, user_id: userId };
    const { data: item, error } = await supabase
      .from("waiting_items")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    await recordTaskPersonMemory(supabase, {
      userId,
      personId: item.person_id,
      itemId: item.id,
      title: item.title,
      source: item.source,
    });
    return item;
  });

export const updateWaitingItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        status: z.enum(["waiting", "received", "snoozed"]).optional(),
        person_id: z.string().uuid().optional().nullable(),
        project_id: z.string().uuid().optional().nullable(),
        person_name: z.string().max(200).optional().nullable(),
        project_name: z.string().max(200).optional().nullable(),
        follow_up_at: z.string().optional().nullable(),
        last_followed_up_at: z.string().optional().nullable(),
        follow_up_count: z.number().int().min(0).optional(),
        auto_follow_up_enabled: z.boolean().optional(),
        semantic_context: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { id, ...updates } = data;
    const memoryRefs = await resolveMemoryRefs(supabase, updates);
    const { data: item, error } = await supabase
      .from("waiting_items")
      .update({ ...updates, ...memoryRefs, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;

    if (memoryRefs.person_id) {
      await recordTaskPersonMemory(supabase, {
        userId,
        personId: memoryRefs.person_id,
        itemId: item.id,
        title: item.title,
        eventType: "note",
        dedupePrefix: "person_assignment",
        source: item.source,
      });
    }
    return item;
  });

export const deleteWaitingItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { error } = await supabase
      .from("waiting_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId).select("id").single();
    if (error) throw error;
  });

// Inbox Items
export const fetchInboxItems = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { userId, supabase } = context;
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createInboxItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        type: z.enum(["task", "commitment", "deadline", "waiting", "followup"]),
        title: z.string().min(1).max(500),
        person_name: z.string().max(200).optional(),
        project_name: z.string().max(200).optional(),
        due_date: z.string().optional(),
        conversation_text: z.string().max(5000).optional(),
        source: z.string().max(200).optional(),
        source_type: z.enum(["paste", "screenshot", "chat", "demo", "manual", "whatsapp", "calendar"]).optional(),
        clarification_type: z.enum(["date", "time", "person", "confirmation"]).optional().nullable(),
        clarification_question: z.string().max(500).optional().nullable(),
        status: z.enum(["pending", "tracked", "ignored"]).optional(),
        semantic_context: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: item, error } = await supabase
      .from("inbox_items")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return item;
  });

export const updateInboxItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "tracked", "ignored"]).optional(),
        task_id: z.string().uuid().optional().nullable(),
        semantic_context: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("inbox_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw error;
  });

export const promoteInboxItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(500).optional(),
      person_name: z.string().max(200).optional(),
      due_date: z.string().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("promote_inbox_item", {
      p_id: data.id,
      p_title: data.title ?? null,
      p_person_name: data.person_name ?? null,
      p_due_date: data.due_date ?? null,
    });
    if (error) throw error;
    return result as { entity: "task" | "waiting"; item: Record<string, unknown> };
  });


// Waiting follow-up state
export const markWaitingFollowedUp = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      next_days: z.number().int().min(1).max(30).default(2),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: current, error: currentError } = await supabase
      .from("waiting_items")
      .select("id,follow_up_count,status")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (currentError) throw currentError;
    if (current.status !== "waiting" && current.status !== "snoozed") {
      throw new Error("Waiting item is no longer active.");
    }
    const now = new Date();
    const next = new Date(now.getTime() + data.next_days * 86400000).toISOString();
    const { data: updated, error } = await supabase
      .from("waiting_items")
      .update({
        last_followed_up_at: now.toISOString(),
        follow_up_at: next,
        follow_up_count: (current.follow_up_count || 0) + 1,
        status: "waiting",
        updated_at: now.toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return updated;
  });

// WhatsApp linking
export const fetchWhatsAppLink = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("whatsapp_user_links")
      .select("phone_number,link_code,link_expires_at,verified_at,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const startWhatsAppLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: existing, error: existingError } = await supabase
      .from("whatsapp_user_links")
      .select("phone_number,verified_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.verified_at) {
      return {
        connected: true,
        phone_number: existing.phone_number,
        code: null,
        expires_at: null,
      };
    }

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const expires = new Date(Date.now() + 15 * 60_000).toISOString();
    const { error } = await supabase.from("whatsapp_user_links").upsert(
      {
        user_id: userId,
        link_code: code,
        link_expires_at: expires,
        phone_number: null,
        verified_at: null,
        pending_inbox_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    return { connected: false, phone_number: null, code, expires_at: expires };
  });

export const disconnectWhatsApp = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { error } = await supabase.from("whatsapp_user_links").delete().eq("user_id", userId);
    if (error) throw error;
    return { success: true };
  });

export const logProductEvent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      event_name: z.string().min(1).max(120),
      item_id: z.string().uuid().optional().nullable(),
      source: z.string().max(80).optional(),
      properties: z.record(z.unknown()).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { error } = await supabase.from("product_events").insert({
      ...data,
      user_id: userId,
      properties: data.properties ?? {},
    });
    if (error) throw error;
    return { success: true };
  });

// Conversations
export const createConversation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        source: z.string().max(200).optional(),
        participant: z.string().max(200).optional(),
        message_text: z.string().min(1).max(20000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return conv;
  });

// AI Messages
export const fetchAiMessages = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { userId, supabase } = context;
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data;
});

export const createAiMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(10000),
        metadata: z.record(z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: msg, error } = await supabase
      .from("ai_messages")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return msg;
  });

export const clearAiMessages = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { error } = await supabase
      .from("ai_messages")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

// Notifications
export const fetchNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  });

export const updateNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["read", "dismissed"]),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: updated, error } = await supabase
      .from("notifications")
      .update({
        status: data.status,
        read_at: data.status === "read" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return updated;
  });

// Seed demo data for new users
export const seedDemoData = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { userId, supabase } = context;

  // Create projects
  const { data: projects } = await supabase
    .from("projects")
    .insert([
      {
        user_id: userId,
        name: "ABC Export Order",
        description: "Order 500 pcs untuk PT ABC, termasuk quotation, katalog dan produksi.",
        color: "#25D366",
      },
      {
        user_id: userId,
        name: "Bali Villa Project",
        description: "Pembangunan villa 3 unit di Canggu, koordinasi kontraktor dan owner.",
        color: "#34B7F1",
      },
      {
        user_id: userId,
        name: "Marketing Campaign",
        description: "Kampanye Ramadhan: artwork, konten dan jadwal posting.",
        color: "#FF6B6B",
      },
      {
        user_id: userId,
        name: "Factory Operations",
        description: "Operasional pabrik harian dan laporan produksi.",
        color: "#FFD93D",
      },
    ])
    .select();

  const projectMap = new Map(projects?.map((p) => [p.name, p.id]) ?? []);

  // Create people
  const { data: people } = await supabase
    .from("people")
    .insert([
      {
        user_id: userId,
        name: "Budi Santoso",
        company: "PT ABC Export",
        role: "Purchasing Manager",
      },
      {
        user_id: userId,
        name: "Siska Amelia",
        company: "Marketing Team",
        role: "Graphic Designer",
      },
      {
        user_id: userId,
        name: "Pak Hendra",
        company: "Factory Operations",
        role: "Kepala Produksi",
      },
      { user_id: userId, name: "Mr. Chen", company: "Supplier China", role: "Sales" },
      { user_id: userId, name: "Ibu Dewi", company: "Bali Villa Project", role: "Owner" },
      { user_id: userId, name: "Agus Wijaya", company: "Management", role: "Direktur" },
    ])
    .select();

  const peopleMap = new Map(people?.map((p) => [p.name, p.id]) ?? []);

  // Create tasks
  const now = new Date();
  const dayMs = 86400000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await supabase.from("tasks").insert([
    {
      user_id: userId,
      title: "Kirim revisi quotation",
      description: "Revisi harga untuk order 500 pcs PT ABC.",
      type: "commitment",
      status: "pending",
      priority: "high",
      due_date: new Date(today.getTime() - dayMs).toISOString(),
      project_id: projectMap.get("ABC Export Order"),
      person_id: peopleMap.get("Budi Santoso"),
      source: "Client ABC",
    },
    {
      user_id: userId,
      title: "Follow up supplier soal shipping",
      description: "Belum ada konfirmasi jadwal kapal dari Supplier China.",
      type: "followup",
      status: "pending",
      priority: "high",
      due_date: new Date(today.getTime() - 2 * dayMs).toISOString(),
      project_id: projectMap.get("ABC Export Order"),
      person_id: peopleMap.get("Mr. Chen"),
      source: "Supplier",
    },
    {
      user_id: userId,
      title: "Kirim katalog revisi",
      type: "commitment",
      status: "pending",
      priority: "high",
      due_date: today.toISOString(),
      project_id: projectMap.get("ABC Export Order"),
      person_id: peopleMap.get("Budi Santoso"),
      source: "Client ABC",
    },
    {
      user_id: userId,
      title: "Cek update produksi",
      type: "task",
      status: "pending",
      priority: "medium",
      due_date: today.toISOString(),
      project_id: projectMap.get("Factory Operations"),
      person_id: peopleMap.get("Pak Hendra"),
      source: "Factory Operations",
    },
    {
      user_id: userId,
      title: "Approve artwork kampanye",
      type: "task",
      status: "pending",
      priority: "medium",
      due_date: today.toISOString(),
      project_id: projectMap.get("Marketing Campaign"),
      person_id: peopleMap.get("Siska Amelia"),
      source: "Marketing Team",
    },
    {
      user_id: userId,
      title: "Rekap penjualan mingguan",
      type: "deadline",
      status: "pending",
      priority: "high",
      due_date: new Date(today.getTime() + 2 * dayMs).toISOString(),
      project_id: projectMap.get("Factory Operations"),
      person_id: peopleMap.get("Agus Wijaya"),
      source: "Management",
    },
    {
      user_id: userId,
      title: "Cek foto progres villa",
      type: "task",
      status: "pending",
      priority: "low",
      due_date: new Date(today.getTime() + dayMs).toISOString(),
      project_id: projectMap.get("Bali Villa Project"),
      person_id: peopleMap.get("Ibu Dewi"),
      source: "Bali Villa Project",
    },
  ]);

  // Create waiting items
  await supabase.from("waiting_items").insert([
    {
      user_id: userId,
      title: "Approval quotation",
      project_id: projectMap.get("ABC Export Order"),
      person_id: peopleMap.get("Budi Santoso"),
      status: "waiting",
      started_at: new Date(today.getTime() - 3 * dayMs).toISOString(),
    },
    {
      user_id: userId,
      title: "Konfirmasi shipping",
      project_id: projectMap.get("ABC Export Order"),
      person_id: peopleMap.get("Mr. Chen"),
      status: "waiting",
      started_at: new Date(today.getTime() - 2 * dayMs).toISOString(),
    },
    {
      user_id: userId,
      title: "Final artwork",
      project_id: projectMap.get("Marketing Campaign"),
      person_id: peopleMap.get("Siska Amelia"),
      status: "waiting",
      started_at: new Date(today.getTime() - dayMs).toISOString(),
    },
    {
      user_id: userId,
      title: "Approval budget kolam renang",
      project_id: projectMap.get("Bali Villa Project"),
      person_id: peopleMap.get("Ibu Dewi"),
      status: "waiting",
      started_at: new Date(today.getTime() - 6 * dayMs).toISOString(),
    },
    {
      user_id: userId,
      title: "Laporan hasil QC batch 3",
      project_id: projectMap.get("Factory Operations"),
      person_id: peopleMap.get("Pak Hendra"),
      status: "waiting",
      started_at: new Date(today.getTime() - 2 * dayMs).toISOString(),
    },
  ]);
});

// User Settings
export const fetchUserSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(
  async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("user_settings")
      .select("settings")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data?.settings as Record<string, unknown>) ?? null;
  },
);

export const upsertUserSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ settings: z.record(z.unknown()) }).parse(data))
  .handler(async ({ context, data }) => {
    const { userId, supabase } = context;
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, settings: data.settings, updated_at: new Date().toISOString() });
    if (error) throw error;
  });
