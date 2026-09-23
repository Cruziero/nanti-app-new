import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const languageMemoryTypes = [
  "phrase_alias",
  "entity_alias",
  "reminder_preference",
  "correction_example",
  "style_preference",
] as const;

export type LanguageMemoryType = (typeof languageMemoryTypes)[number];

export type LanguageMemoryRow = {
  id: string;
  memory_type: LanguageMemoryType;
  pattern_key: string;
  pattern_text: string;
  learned_value: Record<string, unknown>;
  example_text?: string | null;
  source_item_id?: string | null;
  confidence: number;
  evidence_count: number;
  active: boolean;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
};

const memoryInput = z.object({
  memory_type: z.enum(languageMemoryTypes),
  pattern_key: z.string().min(1).max(500),
  pattern_text: z.string().min(1).max(1000),
  learned_value: z.record(z.unknown()).default({}),
  example_text: z.string().max(3000).optional().nullable(),
  source_item_id: z.string().uuid().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().default(0.72),
});

export const fetchLanguageMemories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("user_language_memory")
      .select(
        "id,memory_type,pattern_key,pattern_text,learned_value,example_text,source_item_id,confidence,evidence_count,active,last_used_at,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("active", { ascending: false })
      .order("confidence", { ascending: false })
      .order("evidence_count", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []) as LanguageMemoryRow[];
  });

export const recordLanguageMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => memoryInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: learned, error } = await supabase.rpc("record_language_memory", {
      p_memory_type: data.memory_type,
      p_pattern_key: data.pattern_key,
      p_pattern_text: data.pattern_text,
      p_learned_value: data.learned_value,
      p_example_text: data.example_text ?? null,
      p_source_item_id: data.source_item_id ?? null,
      p_confidence: data.confidence,
    });
    if (error) throw error;
    const row = Array.isArray(learned) ? learned[0] : learned;
    if (!row) throw new Error("NANTI could not save this learned pattern.");
    return row as LanguageMemoryRow;
  });

export const setLanguageMemoryActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: updated, error } = await supabase
      .from("user_language_memory")
      .update({ active: data.active, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return updated as LanguageMemoryRow;
  });

export const deleteLanguageMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: removed, error } = await supabase
      .from("user_language_memory")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw error;
    return removed;
  });

export async function loadLanguageLearningPrompt(
  supabase: any,
  userId: string,
  limit = 24,
) {
  const { data, error } = await supabase
    .from("user_language_memory")
    .select(
      "memory_type,pattern_text,learned_value,example_text,confidence,evidence_count",
    )
    .eq("user_id", userId)
    .eq("active", true)
    .order("confidence", { ascending: false })
    .order("evidence_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load NANTI personal language memory:", error);
    return "";
  }
  if (!data?.length) return "";

  const lines = data.map((row: any) => {
    const value = JSON.stringify(row.learned_value || {}).slice(0, 800);
    const example = row.example_text ? ` · example: ${String(row.example_text).slice(0, 500)}` : "";
    return `- [${row.memory_type}] ${row.pattern_text} => ${value}${example} (confidence ${Number(row.confidence || 0).toFixed(2)}, evidence ${row.evidence_count || 1})`;
  });

  return [
    "PERSONAL LANGUAGE MEMORY FOR THIS USER:",
    "Use these as user-specific evidence. Prefer repeated/high-confidence lessons.",
    "Do not generalize a person/project alias to unrelated contexts. If a learned rule conflicts with an explicit current message, the current message wins.",
    ...lines,
  ].join("\n");
}
