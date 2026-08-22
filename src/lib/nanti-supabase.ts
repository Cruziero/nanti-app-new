import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Projects
export const fetchProjects = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createProject = createServerFn({ method: "POST" })
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
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return project;
  });

export const updateProject = createServerFn({ method: "POST" })
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
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

// People
export const fetchPeople = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createPerson = createServerFn({ method: "POST" })
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
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: person, error } = await supabase
      .from("people")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return person;
  });

export const updatePerson = createServerFn({ method: "POST" })
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
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("people")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deletePerson = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

// Tasks
export const fetchTasks = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createTask = createServerFn({ method: "POST" })
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
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return task;
  });

export const updateTask = createServerFn({ method: "POST" })
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
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { error } = await supabase.from("tasks").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw error;
  });

// Waiting Items
export const fetchWaitingItems = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("waiting_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createWaitingItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1).max(500),
        person_id: z.string().uuid().optional(),
        project_id: z.string().uuid().optional(),
        status: z.enum(["waiting", "received", "snoozed"]).optional(),
        started_at: z.string().optional(),
        days_warning_threshold: z.number().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: item, error } = await supabase
      .from("waiting_items")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return item;
  });

export const updateWaitingItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        status: z.enum(["waiting", "received", "snoozed"]).optional(),
        person_id: z.string().uuid().optional().nullable(),
        project_id: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("waiting_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

export const deleteWaitingItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("waiting_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
  });

// Inbox Items
export const fetchInboxItems = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createInboxItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        type: z.enum(["task", "commitment", "deadline", "waiting", "followup"]),
        title: z.string().min(1).max(500),
        person_name: z.string().max(200).optional(),
        project_name: z.string().max(200).optional(),
        due_date: z.string().optional(),
        conversation_text: z.string().max(5000).optional(),
        status: z.enum(["pending", "tracked", "ignored"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: item, error } = await supabase
      .from("inbox_items")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return item;
  });

export const updateInboxItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "tracked", "ignored"]).optional(),
        task_id: z.string().uuid().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { id, ...updates } = data;
    const { error } = await supabase
      .from("inbox_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  });

// Conversations
export const createConversation = createServerFn({ method: "POST" })
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
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return conv;
  });

// AI Messages
export const fetchAiMessages = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data;
});

export const createAiMessage = createServerFn({ method: "POST" })
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
    const { userId } = context as { userId: string };
    const supabase = getAdminClient();
    const { data: msg, error } = await supabase
      .from("ai_messages")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return msg;
  });

// Seed demo data for new users
export const seedDemoData = createServerFn({ method: "POST" }).handler(async ({ context }) => {
  const { userId } = context as { userId: string };
  const supabase = getAdminClient();

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
