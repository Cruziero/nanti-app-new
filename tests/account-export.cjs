const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");

const api = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/lib/nanti-export-pages.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  { exports: api },
);

for (const [count, cap] of [
  [0, 500],
  [1203, 500],
  [1000, 500],
  [1001, 100],
]) {
  test(`exports all ${count} rows when the server caps pages at ${cap}`, async () => {
    const rows = Array.from({ length: count }, (_, id) => ({ id }));
    const result = await api.readAllExportPages(async (from, to) => ({
      data: rows.slice(from, Math.min(to + 1, from + cap)),
      error: null,
    }));
    assert.equal(result.data.length, count);
    assert.equal(JSON.stringify(result.data), JSON.stringify(rows));
  });
}

test("a later page error fails the export instead of returning a partial file", async () => {
  let calls = 0;
  await assert.rejects(
    api.readAllExportPages(async () =>
      ++calls === 1
        ? { data: [{ id: 1 }], error: null }
        : { data: null, error: new Error("Database unavailable") },
    ),
    /Database unavailable/,
  );
});

test("a missing response fails instead of claiming an empty export", async () => {
  await assert.rejects(
    api.readAllExportPages(async () => ({ data: null, error: null })),
    /no data/,
  );
});

test("account export scopes every page to the caller and excludes Calendar tokens", async () => {
  const requests = [];
  const tasks = Array.from({ length: 1101 }, (_, id) => ({ id, user_id: "owner" }));
  const accountApi = {};
  const client = {
    from(table) {
      const request = { table, filters: [] };
      const query = {
        select(columns) {
          request.columns = columns;
          return query;
        },
        eq(key, value) {
          request.filters.push([key, value]);
          return query;
        },
        order(key) {
          request.order = key;
          return query;
        },
        async range(from, to) {
          requests.push(request);
          return { data: table === "tasks" ? tasks.slice(from, to + 1) : [], error: null };
        },
        async maybeSingle() {
          requests.push(request);
          return { data: null, error: null };
        },
      };
      return query;
    },
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "../src/lib/nanti-account.functions.ts"), "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    ).outputText,
    {
      exports: accountApi,
      process: {
        env: { SUPABASE_URL: "https://fixture.invalid", SUPABASE_SERVICE_ROLE_KEY: "fixture" },
      },
      require(id) {
        if (id === "@tanstack/react-start")
          return {
            createServerFn() {
              const builder = {
                middleware() {
                  return builder;
                },
                inputValidator() {
                  return builder;
                },
                handler(fn) {
                  return fn;
                },
              };
              return builder;
            },
          };
        if (id === "@supabase/supabase-js") return { createClient: () => client };
        if (id === "@/integrations/supabase/auth-middleware") return { requireSupabaseAuth: {} };
        if (id === "./nanti-export-pages") return api;
        return require(id);
      },
    },
  );
  const result = await accountApi.exportMyNantiData({
    context: {
      userId: "owner",
      supabase: client,
      claims: { email: "test@example.invalid" },
    },
  });
  assert.equal(result.data.tasks.length, 1101);
  for (const request of requests) {
    assert.equal(JSON.stringify(request.filters), JSON.stringify([["user_id", "owner"]]));
    if (request.table === "calendar_connections") {
      assert.ok(!request.columns.includes("token"));
      assert.notEqual(request.columns, "*");
    } else if (request.table !== "user_settings") {
      assert.equal(request.order, request.table === "daily_briefings" ? "brief_date" : "id");
    }
  }
});
