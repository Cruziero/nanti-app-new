import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { extractItems } from "@/lib/nanti-ai.server";

type CheckResult = {
  name: string;
  passed: boolean;
  error?: string;
};

export const Route = createFileRoute("/api/cron/launch-e2e")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const started = Date.now();
        const url =
          process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const publishableKey =
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          "";

        if (!url || !serviceKey || !publishableKey) {
          return json({ error: "Supabase launch-test configuration missing" }, 500);
        }

        const admin = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        if (!(await isAuthorized(request, admin))) {
          return json({ error: "Unauthorized" }, 401);
        }

        const runToken = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
        const emailA = `nanti-launch-a+${runToken}@example.com`;
        const emailB = `nanti-launch-b+${runToken}@example.com`;
        const passwordA = `Nanti!Launch-A-${runToken}-9x`;
        const passwordB = `Nanti!Launch-B-${runToken}-7q`;
        const checks: CheckResult[] = [];
        let userA: string | null = null;
        let userB: string | null = null;
        let taskId: string | null = null;
        let waitingId: string | null = null;
        let inboxId: string | null = null;

        const clientA = createClient(url, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const clientB = createClient(url, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const check = async (name: string, fn: () => Promise<void>) => {
          try {
            await fn();
            checks.push({ name, passed: true });
          } catch (error) {
            checks.push({
              name,
              passed: false,
              error: sanitizeError(error),
            });
          }
        };

        try {
          await check("create_disposable_accounts", async () => {
            const [a, b] = await Promise.all([
              admin.auth.admin.createUser({
                email: emailA,
                password: passwordA,
                email_confirm: true,
                app_metadata: { launch_e2e: true },
              }),
              admin.auth.admin.createUser({
                email: emailB,
                password: passwordB,
                email_confirm: true,
                app_metadata: { launch_e2e: true },
              }),
            ]);
            if (a.error) throw a.error;
            if (b.error) throw b.error;
            if (!a.data.user?.id || !b.data.user?.id) {
              throw new Error("Disposable users were not created.");
            }
            userA = a.data.user.id;
            userB = b.data.user.id;
          });

          await check("normal_password_sign_in", async () => {
            const [a, b] = await Promise.all([
              clientA.auth.signInWithPassword({ email: emailA, password: passwordA }),
              clientB.auth.signInWithPassword({ email: emailB, password: passwordB }),
            ]);
            if (a.error) throw a.error;
            if (b.error) throw b.error;
            if (!a.data.session || !b.data.session) {
              throw new Error("Normal sign-in did not produce sessions.");
            }
          });

          await check("task_create_and_cross_account_isolation", async () => {
            const created = await clientA
              .from("tasks")
              .insert({
                title: "Launch E2E · Kirim proposal",
                type: "task",
                status: "pending",
                priority: "medium",
                source: "launch-e2e",
                source_type: "manual",
                quote: "",
                ai_note: "Synthetic launch validation",
                confidence: 1,
                semantic_context: { test: "launch-e2e" },
              })
              .select("id,user_id,title")
              .single();
            if (created.error) throw created.error;
            taskId = created.data.id;

            const other = await clientB
              .from("tasks")
              .select("id")
              .eq("id", taskId);
            if (other.error) throw other.error;
            if ((other.data || []).length !== 0) {
              throw new Error("Cross-account task read was not blocked by RLS.");
            }
          });

          await check("task_edit_reschedule_complete", async () => {
            if (!taskId) throw new Error("Task was not created.");
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const edited = await clientA
              .from("tasks")
              .update({
                title: "Launch E2E · Kirim proposal revisi",
                due_date: tomorrow,
                time: "10:00",
                status: "completed",
              })
              .eq("id", taskId)
              .select("id,title,due_date,time,status")
              .single();
            if (edited.error) throw edited.error;
            if (
              edited.data.status !== "completed" ||
              edited.data.time !== "10:00" ||
              !String(edited.data.title).includes("revisi")
            ) {
              throw new Error("Task edit/reschedule/complete did not persist.");
            }
          });

          await check("waiting_create_and_cross_account_isolation", async () => {
            const created = await clientA
              .from("waiting_items")
              .insert({
                title: "Launch E2E · Tunggu approval Budi",
                person_name: "Budi",
                source: "launch-e2e",
                source_type: "manual",
                quote: "",
                ai_note: "Synthetic launch validation",
                confidence: 1,
                semantic_context: { test: "launch-e2e" },
              })
              .select("id")
              .single();
            if (created.error) throw created.error;
            waitingId = created.data.id;

            const other = await clientB
              .from("waiting_items")
              .select("id")
              .eq("id", waitingId);
            if (other.error) throw other.error;
            if ((other.data || []).length !== 0) {
              throw new Error("Cross-account Waiting read was not blocked by RLS.");
            }
          });

          await check("inbox_create_and_cross_account_isolation", async () => {
            const created = await clientA
              .from("inbox_items")
              .insert({
                title: "Launch E2E · Klarifikasi jadwal",
                type: "commitment",
                status: "pending",
                source: "launch-e2e",
                source_type: "manual",
                clarification_type: "time",
                clarification_question: "Jam berapa?",
                semantic_context: { test: "launch-e2e" },
              })
              .select("id")
              .single();
            if (created.error) throw created.error;
            inboxId = created.data.id;

            const other = await clientB
              .from("inbox_items")
              .select("id")
              .eq("id", inboxId);
            if (other.error) throw other.error;
            if ((other.data || []).length !== 0) {
              throw new Error("Cross-account Inbox read was not blocked by RLS.");
            }
          });

          await check("real_gemini_typo_extraction", async () => {
            const result = await extractItems(
              "Saya beosok harus oulang dr puncak jam 10 pagi",
              "launch-e2e",
            );
            const item = result.items?.[0];
            if (!item) throw new Error("Gemini returned no actionable item.");
            const normalized = `${item.title || ""} ${item.what || ""} ${item.normalizedText || ""}`
              .toLowerCase();
            if (!normalized.includes("pulang")) {
              throw new Error("Gemini did not normalize the intended 'pulang' action.");
            }
            if (item.dueTime && item.dueTime !== "10:00") {
              throw new Error(`Gemini returned unexpected time ${item.dueTime}.`);
            }
          });

          await check("task_delete", async () => {
            if (!taskId) throw new Error("Task was not created.");
            const deleted = await clientA
              .from("tasks")
              .delete()
              .eq("id", taskId)
              .select("id");
            if (deleted.error) throw deleted.error;
            if ((deleted.data || []).length !== 1) {
              throw new Error("Owned task was not deleted.");
            }
          });
        } finally {
          await Promise.allSettled([
            clientA.auth.signOut(),
            clientB.auth.signOut(),
          ]);

          for (const id of [userA, userB]) {
            if (id) {
              const { error } = await admin.auth.admin.deleteUser(id);
              if (error) {
                checks.push({
                  name: "cleanup_disposable_account",
                  passed: false,
                  error: sanitizeError(error),
                });
              }
            }
          }

          if (userA || userB) {
            const ids = [userA, userB].filter((id): id is string => Boolean(id));
            const [tasks, waiting, inbox] = await Promise.all([
              admin.from("tasks").select("id").in("user_id", ids),
              admin.from("waiting_items").select("id").in("user_id", ids),
              admin.from("inbox_items").select("id").in("user_id", ids),
            ]);
            const leftovers =
              (tasks.data?.length || 0) +
              (waiting.data?.length || 0) +
              (inbox.data?.length || 0);
            checks.push({
              name: "cleanup_cascades_user_data",
              passed: leftovers === 0 && !tasks.error && !waiting.error && !inbox.error,
              ...(leftovers
                ? { error: `Found ${leftovers} leftover synthetic row(s).` }
                : {}),
            });
          }
        }

        const passed = checks.every((item) => item.passed);
        const report = {
          suite: "launch-e2e-v1",
          environment: process.env.VERCEL_ENV || "production",
          gitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
          passed,
          checks,
          durationMs: Date.now() - started,
        };

        const { error: saveError } = await admin.from("launch_validation_runs").insert({
          suite: report.suite,
          environment: report.environment,
          git_sha: report.gitSha,
          passed: report.passed,
          checks: report.checks,
          duration_ms: report.durationMs,
        });

        if (saveError) {
          console.error("Could not store launch validation run:", saveError);
        }

        return json(report, passed ? 200 : 500);
      },
    },
  },
});

async function isAuthorized(
  request: Request,
  supabase: SupabaseClient,
) {
  const header = request.headers.get("Authorization") || "";
  const envSecret = process.env.CRON_SECRET;
  if (envSecret && header === `Bearer ${envSecret}`) return true;

  const { data, error } = await supabase
    .from("automation_runtime")
    .select("secret")
    .eq("key", "launch_e2e")
    .maybeSingle();

  if (error) {
    console.error("Could not read launch E2E credential:", error);
    return false;
  }
  return Boolean(data?.secret && header === `Bearer ${data.secret}`);
}

function sanitizeError(error: unknown) {
  const coded = error as Error & {
    providerCode?: string;
    providerStatus?: number;
  };
  const message = error instanceof Error ? error.message : String(error);
  const provider =
    coded?.providerCode
      ? ` [provider=${coded.providerCode}${coded.providerStatus ? ` status=${coded.providerStatus}` : ""}]`
      : "";
  return `${message}${provider}`
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[redacted-email]")
    .slice(0, 500);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
