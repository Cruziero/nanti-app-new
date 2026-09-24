import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAssistantTurn } from "./nanti-ai.server";
import { normalizeCasualIndonesian } from "./nanti-language";
import {
  selectDailyAssistantSmokeFixtures,
  type AssistantSmokeFixture,
} from "./nanti-assistant-smoke-fixtures";

function requireNantiAdmin(claims: unknown) {
  const value = claims as {
    app_metadata?: { role?: string };
  } | null;
  if (value?.app_metadata?.role !== "admin") {
    throw new Error("Forbidden: internal NANTI diagnostics require admin access.");
  }
}

export type AssistantEvalRun = {
  id: string;
  suite: string;
  environment: string;
  model?: string | null;
  git_sha?: string | null;
  total: number;
  passed: number;
  score: number;
  critical_failures: string[];
  failures: Array<{
    id?: string;
    input?: string;
    expected?: unknown;
    actual?: unknown;
    errors?: string[];
  }>;
  duration_ms?: number | null;
  created_at: string;
};

function adminClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase service configuration is missing.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const fetchAssistantQuality = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireNantiAdmin(context.claims);
    const supabase = adminClient();
    const { data, error } = await supabase
      .from("assistant_eval_runs")
      .select(
        "id,suite,environment,model,git_sha,total,passed,score,critical_failures,failures,duration_ms,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(14);
    if (error) throw error;

    const runs = (data || []) as AssistantEvalRun[];
    return {
      latest: runs[0] || null,
      runs,
      healthy:
        !runs[0] ||
        ((runs[0].critical_failures || []).length === 0 && Number(runs[0].score) >= 0.8),
    };
  });

export const runAssistantSmokeCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireNantiAdmin(context.claims);
    const supabase = adminClient();

    const { data: latest, error: latestError } = await supabase
      .from("assistant_eval_runs")
      .select(
        "id,suite,environment,model,git_sha,total,passed,score,critical_failures,failures,duration_ms,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw latestError;

    if (
      latest?.created_at &&
      Date.now() - new Date(latest.created_at).getTime() < 10 * 60 * 1000
    ) {
      return {
        cached: true,
        run: latest as AssistantEvalRun,
      };
    }

    const started = Date.now();
    const fixtures = selectDailyAssistantSmokeFixtures(new Date());
    const results: EvalResult[] = [];

    for (let index = 0; index < fixtures.length; index += 2) {
      const pair = fixtures.slice(index, index + 2);
      const batch = await Promise.all(pair.map((fixture) => evaluateFixture(fixture)));
      results.push(...batch);
    }

    const passed = results.filter((result) => result.passed).length;
    const score = results.length ? passed / results.length : 0;
    const criticalFailures = results
      .filter((result) => result.critical && !result.passed)
      .map((result) => result.id);
    const failures = results.filter((result) => !result.passed);
    const durationMs = Date.now() - started;

    const payload = {
      suite: "manual-smoke-v1",
      environment: process.env["VERCEL_ENV"] || "production",
      model:
        process.env["GEMINI_MODEL"] ||
        process.env["OPENAI_MODEL"] ||
        "default-provider-model",
      git_sha: process.env["VERCEL_GIT_COMMIT_SHA"] || null,
      total: results.length,
      passed,
      score,
      critical_failures: criticalFailures,
      failures: failures.map((failure) => ({
        id: failure.id,
        input: failure.input,
        expected: failure.expected,
        actual: failure.actual,
        errors: failure.errors,
      })),
      duration_ms: durationMs,
    };

    const { data: saved, error: saveError } = await supabase
      .from("assistant_eval_runs")
      .insert(payload)
      .select(
        "id,suite,environment,model,git_sha,total,passed,score,critical_failures,failures,duration_ms,created_at",
      )
      .single();
    if (saveError) throw saveError;

    return {
      cached: false,
      run: saved as AssistantEvalRun,
    };
  });

type EvalResult = {
  id: string;
  critical: boolean;
  input: string;
  expected: AssistantSmokeFixture["expect"];
  actual: {
    mode: string;
    targetId: string | null;
    confidence: number;
    reminderOffsetMinutes: number | null;
    learningType: string | null;
    learningEntityType: string | null;
    items: Array<{ title: string; kind: string }>;
    reply: string;
  };
  passed: boolean;
  errors: string[];
};

async function evaluateFixture(fixture: AssistantSmokeFixture): Promise<EvalResult> {
  const result = await runAssistantTurn({
    rawMessage: fixture.message,
    normalizedMessage:
      fixture.normalized || normalizeCasualIndonesian(fixture.message),
    workspaceContext: fixture.workspace || "",
    itemContext: fixture.items || [],
    recentConversation: fixture.recent || "",
  });

  const errors = scoreFixture(fixture, result);
  return {
    id: fixture.id,
    critical: Boolean(fixture.critical),
    input: fixture.message,
    expected: fixture.expect,
    actual: {
      mode: result.mode,
      targetId: result.targetId,
      confidence: result.confidence,
      reminderOffsetMinutes: result.reminderOffsetMinutes,
      learningType: result.learningType,
      learningEntityType: result.learningEntityType,
      items: (result.items || []).map((item) => ({
        title: item.title,
        kind: item.kind,
      })),
      reply: result.reply,
    },
    passed: errors.length === 0,
    errors,
  };
}

function scoreFixture(
  fixture: AssistantSmokeFixture,
  result: Awaited<ReturnType<typeof runAssistantTurn>>,
) {
  const errors: string[] = [];
  const expected = fixture.expect;

  if (result.mode !== expected.mode) {
    errors.push(`mode expected ${expected.mode}, got ${result.mode}`);
  }
  if (expected.target && result.targetId !== expected.target) {
    errors.push(`target expected ${expected.target}, got ${result.targetId}`);
  }
  if (expected.targetMustBeNull && result.targetId !== null) {
    errors.push(`target expected null, got ${result.targetId}`);
  }
  if (
    expected.offset != null &&
    result.reminderOffsetMinutes !== expected.offset
  ) {
    errors.push(
      `reminder offset expected ${expected.offset}, got ${result.reminderOffsetMinutes}`,
    );
  }
  if (
    expected.learningType &&
    result.learningType !== expected.learningType
  ) {
    errors.push(
      `learning type expected ${expected.learningType}, got ${result.learningType}`,
    );
  }
  if (
    expected.entityType &&
    result.learningEntityType !== expected.entityType
  ) {
    errors.push(
      `entity type expected ${expected.entityType}, got ${result.learningEntityType}`,
    );
  }
  if (
    expected.minItems != null &&
    (result.items?.length || 0) < expected.minItems
  ) {
    errors.push(
      `expected at least ${expected.minItems} created items, got ${result.items?.length || 0}`,
    );
  }
  if (expected.kind && result.items?.[0]?.kind !== expected.kind) {
    errors.push(
      `first item kind expected ${expected.kind}, got ${result.items?.[0]?.kind}`,
    );
  }
  if (
    expected.titleIncludes &&
    !result.items?.some((item) =>
      String(item.title || item.what || "")
        .toLowerCase()
        .includes(expected.titleIncludes!.toLowerCase()),
    )
  ) {
    errors.push(`created title should include "${expected.titleIncludes}"`);
  }

  return errors;
}
