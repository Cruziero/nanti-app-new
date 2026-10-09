const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, overrides = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      exports,
      require: (name) => (Object.hasOwn(overrides, name) ? overrides[name] : require(name)),
      Buffer,
      URL,
      URLSearchParams,
      Date,
      Request,
      Response,
      AbortSignal,
      crypto: require("node:crypto").webcrypto,
      process: { env: { GMAIL_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64") } },
      ...globals,
    },
  );
  return exports;
}
const core = load("src/lib/nanti-gmail.server.ts");
const owner = "00000000-0000-4000-8000-000000000001";
const personal = "00000000-0000-4000-8000-000000000002";
const business = "00000000-0000-4000-8000-000000000003";
const connectionId = "00000000-0000-4000-8000-000000000004";

function dbWithRows(rows, log = []) {
  return {
    from(table) {
      const request = { table, filters: [], columns: "*" };
      const q = {
        select(columns) {
          request.columns = columns;
          return q;
        },
        eq(key, value) {
          request.filters.push([key, value]);
          return q;
        },
        single: async () => {
          log.push(request);
          const data = (rows[table] || []).find((row) =>
            request.filters.every(([key, value]) => row[key] === value),
          );
          return { data: data || null, error: data ? null : new Error("No matching row") };
        },
      };
      return q;
    },
  };
}

test("encrypted tokens are bound to the owner, workspace and mailbox", () => {
  const sealed = core.sealToken("refresh-secret", `${owner}:${personal}:me@example.com`);
  assert.ok(!sealed.includes("refresh-secret"));
  assert.equal(core.openToken(sealed, `${owner}:${personal}:me@example.com`), "refresh-secret");
  assert.throws(() => core.openToken(sealed, `${owner}:${business}:me@example.com`));
  const tampered = Buffer.from(sealed, "base64");
  tampered[30] ^= 1;
  assert.throws(() =>
    core.openToken(tampered.toString("base64"), `${owner}:${personal}:me@example.com`),
  );
});

test("deduplication survives reconnecting the same mailbox and normalizes titles", () => {
  assert.equal(
    core.taskDedupeKey("Me@Example.com", "abc", "  Bayar   invoice "),
    core.taskDedupeKey("me@example.com", "abc", "bayar invoice"),
  );
  assert.notEqual(
    core.taskDedupeKey("other@example.com", "abc", "bayar invoice"),
    core.taskDedupeKey("me@example.com", "abc", "bayar invoice"),
  );
});

test("MIME parsing prefers plaintext and excludes attachments", () => {
  const body = (s) => ({ data: Buffer.from(s).toString("base64url") });
  const message = core.previewMessage(
    {
      id: "abc",
      internalDate: "1760000000000",
      payload: {
        mimeType: "multipart/mixed",
        headers: [
          { name: "Subject", value: "Bayar invoice" },
          { name: "From", value: "Supplier" },
        ],
        parts: [
          {
            mimeType: "multipart/alternative",
            parts: [
              { mimeType: "text/html", body: body("<b>wrong alternative</b>") },
              { mimeType: "text/plain", body: body("Bayar besok Rp 500.000") },
            ],
          },
          { mimeType: "text/plain", filename: "secret.txt", body: body("attachment secret") },
        ],
      },
    },
    "me@example.com",
  );
  assert.equal(message.text, "Bayar besok Rp 500.000");
  assert.equal(message.subject, "Bayar invoice");
  assert.ok(message.url.includes("authuser=me%40example.com"));
});

test("HTML is returned as inert text and long bodies are bounded", () => {
  const result = core.previewMessage(
    {
      id: "abc",
      payload: {
        mimeType: "text/html",
        body: {
          data: Buffer.from("<script>alert(1)</script><p>Bayar &amp; konfirmasi</p>").toString(
            "base64url",
          ),
        },
      },
    },
    "me@example.com",
  );
  assert.ok(!result.text.includes("alert"));
  assert.ok(!result.text.includes("<"));
  assert.ok(result.text.includes("Bayar & konfirmasi"));
  assert.equal(
    core.previewMessage(
      {
        id: "abc",
        payload: {
          mimeType: "text/plain",
          body: { data: Buffer.from("a".repeat(25000)).toString("base64url") },
        },
      },
      "me@example.com",
    ).text.length,
    18000,
  );
});

test("connection lookups reject both another user and another workspace", async () => {
  const log = [];
  const db = dbWithRows(
    {
      email_workspaces: [
        { id: personal, user_id: owner },
        { id: business, user_id: owner },
      ],
      gmail_connections: [{ id: connectionId, user_id: owner, workspace_id: personal }],
    },
    log,
  );
  await core.ownedConnection(db, owner, personal, connectionId);
  await assert.rejects(
    core.ownedConnection(db, "another-user", personal, connectionId),
    /workspace/,
  );
  await assert.rejects(core.ownedConnection(db, owner, business, connectionId), /connection/);
  assert.deepEqual(log.filter((r) => r.table === "gmail_connections").at(-1).filters, [
    ["id", connectionId],
    ["user_id", owner],
    ["workspace_id", business],
  ]);
});

function functions(coreOverrides, ai = {}, env = {}) {
  const marker = {};
  const cookies = [];
  const handlers = load(
    "src/lib/nanti-gmail.functions.ts",
    {
      "@tanstack/react-start": {
        createServerFn: () => {
          let validator = (data) => data;
          return {
            middleware(list) {
              assert.equal(list[0], marker);
              return this;
            },
            inputValidator(fn) {
              validator = fn;
              return this;
            },
            handler(fn) {
              return (data, context = { userId: owner }) => fn({ data: validator(data), context });
            },
          };
        },
      },
      "@tanstack/react-start/server": { setCookie: (...args) => cookies.push(args) },
      "@/integrations/supabase/auth-middleware": { requireSupabaseAuth: marker },
      "./nanti-gmail.server": { ...core, ...coreOverrides },
      "./nanti-ai.functions": { consumeAiQuota: async () => {} },
      "./nanti-ai.server": ai,
    },
    { process: { env } },
  );
  return { ...handlers, cookies };
}

test("Gmail connection requests only read access and binds state to an HttpOnly cookie", async () => {
  let state;
  const api = functions({
    ownedWorkspace: async () => ({}),
    gmailConfig: () => ({
      clientId: "client",
      redirectUri: "https://nanti.example/api/auth/gmail",
    }),
    gmailAdmin: () => ({
      from: () => ({
        insert: async (row) => {
          state = row;
          return { error: null };
        },
      }),
    }),
  });
  const result = await api.startGmailConnect({ workspaceId: personal });
  const url = new URL(result.url);
  assert.equal(url.searchParams.get("scope"), core.GMAIL_SCOPE);
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(state.user_id, owner);
  assert.equal(state.workspace_id, personal);
  assert.equal(url.searchParams.get("state"), api.cookies[0][1]);
  assert.equal(api.cookies[0][2].httpOnly, true);
  assert.equal(api.cookies[0][2].sameSite, "lax");
});

test("AI analysis is gated by explicit consent and paid-tier configuration", async () => {
  const api = functions({
    gmailAdmin: () => {
      throw new Error("must not reach database");
    },
  });
  await assert.rejects(
    api.suggestGmailTasks({
      workspaceId: personal,
      connectionId,
      messageId: "abc",
      consentToAi: true,
    }),
    /not enabled/,
  );
  assert.throws(() =>
    api.suggestGmailTasks({
      workspaceId: personal,
      connectionId,
      messageId: "abc",
      consentToAi: false,
    }),
  );
});

test("business email extraction receives only this email and no personal memories", async () => {
  let supplied;
  const api = functions(
    {
      gmailAdmin: () => ({}),
      ownedWorkspace: async () => ({ kind: "business" }),
      ownedConnection: async () => ({ email: "work@example.com" }),
      gmailRequest: async () => ({
        id: "abc",
        payload: {
          mimeType: "text/plain",
          body: { data: Buffer.from("Please send invoice").toString("base64url") },
        },
      }),
    },
    {
      extractItems: async (...args) => {
        supplied = args;
        return { summary: "", items: [] };
      },
    },
    { GEMINI_PAID_TIER: "true" },
  );
  await api.suggestGmailTasks({
    workspaceId: business,
    connectionId,
    messageId: "abc",
    consentToAi: true,
  });
  assert.ok(supplied[0].includes("Please send invoice"));
  assert.ok(supplied[2].includes("business"));
  assert.ok(supplied[2].includes("untrusted"));
  assert.ok(!supplied.join(" ").includes("Personal memory content"));
});

test("zero-row task updates fail instead of reporting success", async () => {
  const filters = [];
  const q = {
    update: () => q,
    eq: (k, v) => {
      filters.push([k, v]);
      return q;
    },
    select: () => q,
    single: async () => ({ data: null, error: new Error("No rows") }),
  };
  const api = functions({
    gmailAdmin: () => ({ from: () => q }),
    ownedWorkspace: async () => ({}),
  });
  await assert.rejects(
    api.updateGmailTask({ workspaceId: business, taskId: connectionId, status: "done" }),
    /Could not update/,
  );
  assert.deepEqual(filters, [
    ["id", connectionId],
    ["user_id", owner],
    ["workspace_id", business],
  ]);
});

test("repeat saves return the original task and keep owner/workspace filters", async () => {
  const filters = [];
  let inserted;
  const q = {
    insert: (row) => {
      inserted = row;
      return q;
    },
    select: () => q,
    eq: (k, v) => {
      filters.push([k, v]);
      return q;
    },
    single: async () =>
      filters.length
        ? { data: { id: "original" }, error: null }
        : { data: null, error: { code: "23505" } },
  };
  const api = functions({
    gmailAdmin: () => ({ from: () => q }),
    ownedConnection: async () => ({ email: "work@example.com" }),
    gmailRequest: async () => ({
      id: "abc",
      payload: { headers: [{ name: "Subject", value: "Invoice" }] },
    }),
  });
  const result = await api.createGmailTask({
    workspaceId: business,
    connectionId,
    messageId: "abc",
    title: "Send invoice",
  });
  assert.equal(result.id, "original");
  assert.equal(result.duplicate, true);
  assert.equal(inserted.user_id, owner);
  assert.equal(inserted.workspace_id, business);
  assert.deepEqual(filters.slice(0, 2), [
    ["user_id", owner],
    ["workspace_id", business],
  ]);
});

function callback(coreOverrides, fetch) {
  return load(
    "src/routes/api/auth/gmail.tsx",
    {
      "@tanstack/react-router": { createFileRoute: () => (config) => config },
      "@/lib/nanti-gmail.server": { ...core, ...coreOverrides },
    },
    { fetch },
  ).Route.server.handlers.GET;
}

test("OAuth callbacks reject missing, mismatched and malformed browser state before token exchange", async () => {
  const get = callback(
    {
      gmailAdmin: () => {
        throw new Error("must not touch database");
      },
    },
    () => {
      throw new Error("must not exchange tokens");
    },
  );
  for (const cookie of ["", "nanti_gmail_state=wrong", "nanti_gmail_state=%bad"]) {
    const result = await get({
      request: new Request("https://nanti.example/api/auth/gmail?state=expected&code=code", {
        headers: { cookie },
      }),
    });
    assert.equal(result.status, 303);
    assert.ok(result.headers.get("Location").includes("invalid_state"));
  }
});

test("OAuth states are consumed atomically and replayed/expired states cannot exchange tokens", async () => {
  const filters = [];
  const q = {
    delete: () => q,
    eq: (k, v) => {
      filters.push([k, v]);
      return q;
    },
    gt: (k, v) => {
      filters.push([k, v]);
      return q;
    },
    select: () => q,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  const get = callback(
    {
      gmailConfig: () => ({ origin: "https://nanti.example" }),
      gmailAdmin: () => ({ from: () => q }),
    },
    () => {
      throw new Error("must not exchange tokens");
    },
  );
  const result = await get({
    request: new Request("https://nanti.example/api/auth/gmail?state=expected&code=code", {
      headers: { cookie: "nanti_gmail_state=expected" },
    }),
  });
  assert.ok(result.headers.get("Location").includes("expired_state"));
  assert.equal(filters[0][0], "state");
  assert.equal(filters[1][0], "expires_at");
});

test("account export includes email tasks and connection metadata without credentials", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../src/lib/nanti-account.functions.ts"),
    "utf8",
  );
  assert.ok(source.includes("email_workspaces: emailWorkspaces.data"));
  assert.ok(source.includes("email_tasks: emailTasks.data"));
  assert.match(
    source,
    /from\("gmail_connections"\)\s*\.select\("id,workspace_id,email,status,connected_at"\)/,
  );
  assert.ok(!source.includes("refresh_token_encrypted"));
});
