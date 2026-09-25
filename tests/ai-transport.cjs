const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, "../src/lib/nanti-ai.server.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function setup(env, responses) {
  const requests = [];
  const timeouts = [];
  const logs = [];
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    process: { env },
    console: { error: (...args) => logs.push(args.map(String).join(" ")) },
    AbortSignal: {
      timeout(ms) {
        timeouts.push(ms);
        return AbortSignal.timeout(ms);
      },
    },
    setTimeout: (fn) => {
      fn();
      return 0;
    },
    fetch: async (url, init) => {
      requests.push({ url, init });
      const next = responses.shift();
      assert.ok(next, "Unexpected provider request");
      if (next instanceof Error) throw next;
      return { ok: true, status: 200, json: async () => next, ...next };
    },
  });
  return { api: exports, requests, timeouts, logs };
}

const gemini = (text = "Test answer", finishReason = "STOP") => ({
  candidates: [{ finishReason, content: { parts: [{ text }] } }],
});

test("Gemini uses a header key, an escaped model path and a bounded request", async () => {
  const h = setup({ GEMINI_API_KEY: "fixture-key", GEMINI_MODEL: "model/name" }, [gemini()]);
  assert.equal(await h.api.askNanti("Test question", ""), "Test answer");
  assert.equal(h.requests.length, 1);
  assert.ok(h.requests[0].url.endsWith("/model%2Fname:generateContent"));
  assert.ok(!h.requests[0].url.includes("fixture-key"));
  assert.equal(h.requests[0].init.headers["x-goog-api-key"], "fixture-key");
  assert.ok(h.requests[0].init.signal instanceof AbortSignal);
  assert.deepEqual(h.timeouts, [30000]);
  const body = JSON.parse(h.requests[0].init.body);
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "low");
});

test("Gemini thought text does not appear in the answer", async () => {
  const h = setup({ GEMINI_API_KEY: "fixture-key" }, [
    {
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ thought: true, text: "Internal" }, { text: "Answer" }] },
        },
      ],
    },
  ]);
  assert.equal(await h.api.askNanti("Test question", ""), "Answer");
});

for (const [name, response] of [
  ["truncated Gemini output", gemini("Partial", "MAX_TOKENS")],
  ["missing finish reason", { candidates: [{ content: { parts: [{ text: "Partial" }] } }] }],
  ["missing candidates", {}],
  ["empty Gemini text", gemini("  ")],
]) {
  test(`${name} rejects instead of returning successful output`, async () => {
    const h = setup({ GEMINI_API_KEY: "fixture-key" }, [response]);
    await assert.rejects(h.api.askNanti("Test question", ""), /AI sedang bermasalah/);
    assert.equal(h.requests.length, 1);
  });
}

test("Gemini retries transient quota errors once", async () => {
  const h = setup(
    {
      GEMINI_API_KEY: "fixture-key",
      GEMINI_FALLBACK_MODEL: "gemini-3.5-flash",
    },
    [
      { ok: false, status: 429 },
      { ok: false, status: 429 },
    ],
  );
  await assert.rejects(h.api.askNanti("Test question", ""), /AI sedang bermasalah/);
  assert.equal(h.requests.length, 2);
  assert.deepEqual(h.timeouts, [30000, 30000]);
});

test("Gemini retries provider timeouts once", async () => {
  const timeout = Object.assign(new Error("Timeout"), { name: "TimeoutError" });
  const h = setup(
    {
      GEMINI_API_KEY: "fixture-key",
      GEMINI_FALLBACK_MODEL: "gemini-3.5-flash",
    },
    [timeout, timeout],
  );
  await assert.rejects(h.api.askNanti("Test question", ""), /AI sedang bermasalah/);
  assert.equal(h.requests.length, 2);
});

test("Gemini does not retry permanent permission errors", async () => {
  const h = setup({ GEMINI_API_KEY: "fixture-key" }, [
    { ok: false, status: 403 },
  ]);
  await assert.rejects(h.api.askNanti("Test question", ""), /AI sedang bermasalah/);
  assert.equal(h.requests.length, 1);
});

test("Gemini errors do not leak upstream payloads or call another provider", async () => {
  const failure = { ok: false, status: 503, text: async () => "sensitive upstream payload" };
  const h = setup(
    {
      GEMINI_API_KEY: "fixture-key",
      GEMINI_FALLBACK_MODEL: "gemini-3.5-flash",
      OPENAI_API_KEY: "unused",
    },
    [failure, failure],
  );
  await assert.rejects(h.api.askNanti("Test question", ""), /AI sedang bermasalah/);
  assert.equal(h.requests.length, 2);
  assert.ok(!h.logs.join(" ").includes("sensitive upstream payload"));
});

test("a legacy OpenAI key does not enable an unapproved provider", async () => {
  const h = setup({ OPENAI_API_KEY: "unused" }, []);
  await assert.rejects(h.api.askNanti("Test question", ""), /AI belum dikonfigurasi/);
  assert.equal(h.requests.length, 0);
});

test("malformed extraction JSON rejects instead of reporting zero tasks", async () => {
  const h = setup({ GEMINI_API_KEY: "fixture-key" }, [gemini("{broken")]);
  await assert.rejects(h.api.extractItems("Synthetic conversation"), /AI sedang bermasalah/);
});

test("no configured provider makes no network requests", async () => {
  const h = setup({}, []);
  await assert.rejects(h.api.askNanti("Test question", ""), /AI belum dikonfigurasi/);
  assert.equal(h.requests.length, 0);
});


test("answer mode never exposes a mutable target id", async () => {
  const h = setup({ GEMINI_API_KEY: "fixture-key" }, [
    gemini(JSON.stringify({
      mode: "answer",
      reply: "Pak Budi belum balas.",
      confidence: 0.95,
      targetId: "w1",
      items: [],
    })),
  ]);
  const result = await h.api.runAssistantTurn({
    rawMessage: "pak b belum bales jadi gimana?",
    normalizedMessage: "pak b belum balas jadi bagaimana?",
    workspaceContext: "",
    itemContext: [
      { id: "w1", title: "Tunggu jawaban kontrak", kind: "waiting", status: "open" },
    ],
    recentConversation: "",
  });
  assert.equal(result.mode, "answer");
  assert.equal(result.targetId, null);
});

test("mutable command modes keep a valid target id", async () => {
  const h = setup({ GEMINI_API_KEY: "fixture-key" }, [
    gemini(JSON.stringify({
      mode: "complete",
      reply: "Siap, saya tandai selesai.",
      confidence: 0.95,
      targetId: "t1",
      items: [],
    })),
  ]);
  const result = await h.api.runAssistantTurn({
    rawMessage: "yang tadi sudah selesai",
    normalizedMessage: "yang tadi sudah selesai",
    workspaceContext: "",
    itemContext: [
      { id: "t1", title: "Kirim invoice", kind: "task", status: "open" },
    ],
    recentConversation: "",
  });
  assert.equal(result.mode, "complete");
  assert.equal(result.targetId, "t1");
});


test("Gemini falls back to Flash-Lite after retryable primary exhaustion", async () => {
  const h = setup(
    {
      GEMINI_API_KEY: "fixture-key",
      GEMINI_MODEL: "gemini-3.5-flash",
      GEMINI_FALLBACK_MODEL: "gemini-3.5-flash-lite",
    },
    [
      { ok: false, status: 429 },
      { ok: false, status: 429 },
      gemini("Fallback answer"),
    ],
  );
  assert.equal(await h.api.askNanti("Test question", ""), "Fallback answer");
  assert.equal(h.requests.length, 3);
  assert.ok(h.requests[0].url.endsWith("/gemini-3.5-flash:generateContent"));
  assert.ok(h.requests[2].url.endsWith("/gemini-3.5-flash-lite:generateContent"));
});
