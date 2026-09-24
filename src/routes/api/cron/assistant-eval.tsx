import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { runAssistantTurn } from "@/lib/nanti-ai.server";
import { normalizeCasualIndonesian } from "@/lib/nanti-language";
import {
  selectDailyAssistantSmokeFixtures,
  type AssistantSmokeFixture,
} from "@/lib/nanti-assistant-smoke-fixtures";

export const Route = createFileRoute("/api/cron/assistant-eval")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const started = Date.now();
        try {
          if (!isAuthorized(request)) {
            return json({ error: "Unauthorized" }, 401);
          }

          const supabaseUrl =
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
          if (!supabaseUrl || !serviceKey) {
            return json({ error: "Supabase service configuration missing" }, 500);
          }

          const supabase = createClient(supabaseUrl, serviceKey);
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

          const report = {
            suite: "production-smoke-v1",
            environment: process.env.VERCEL_ENV || "production",
            model: process.env.GEMINI_MODEL || "default-provider-model",
            gitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
            total: results.length,
            passed,
            score,
            criticalFailures,
            durationMs,
            results,
          };

          const { error: saveError } = await supabase.from("assistant_eval_runs").insert({
            suite: report.suite,
            environment: report.environment,
            model: report.model,
            git_sha: report.gitSha,
            total: report.total,
            passed: report.passed,
            score: report.score,
            critical_failures: report.criticalFailures,
            failures: failures.map((failure) => ({
              id: failure.id,
              input: failure.input,
              expected: failure.expected,
              actual: failure.actual,
              errors: failure.errors,
            })),
            duration_ms: report.durationMs,
          });
          if (saveError) {
            console.error("Failed to store assistant eval run:", saveError);
          }

          const unhealthy = criticalFailures.length > 0 || score < 0.8;
          return json(report, unhealthy ? 500 : 200);
        } catch (error) {
          console.error("Assistant production eval failed:", error);
          return json(
            {
              error: "Assistant evaluation failed",
              message: error instanceof Error ? error.message : String(error),
              durationMs: Date.now() - started,
            },
            500,
          );
        }
      },
    },
  },
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
  const evaluated: EvalResult = {
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

  if (!evaluated.passed) {
    console.error("Assistant smoke failure:", evaluated);
  }
  return evaluated;
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

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("Authorization") === `Bearer ${secret}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
