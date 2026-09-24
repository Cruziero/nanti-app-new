const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assistant-live-eval-fixtures.json"), "utf8"),
).fixtures;

const cache = new Map();
function loadTs(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (id) => {
    if (id.startsWith(".")) {
      const base = path.resolve(path.dirname(filename), id);
      const target = ["", ".ts", ".tsx"]
        .map((ext) => base + ext)
        .find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
      if (!target) throw new Error(`Cannot resolve ${id} from ${filename}`);
      return loadTs(target);
    }
    return require(id);
  };
  vm.runInThisContext(
    `(function(require,module,exports,__filename,__dirname){${source}\n})`,
    { filename },
  )(localRequire, module, module.exports, filename, path.dirname(filename));
  return module.exports;
}

const ai = loadTs(path.join(root, "src/lib/nanti-ai.server.ts"));
const language = loadTs(path.join(root, "src/lib/nanti-language.ts"));

if (!process.env.GEMINI_API_KEY) {
  console.error("Live eval requires GEMINI_API_KEY.");
  process.exit(2);
}

const minScore = Number(process.env.NANTI_LIVE_EVAL_MIN_SCORE || 0.9);
const maxConcurrency = Math.max(
  1,
  Math.min(4, Number(process.env.NANTI_LIVE_EVAL_CONCURRENCY || 2)),
);

function includesCI(value, expected) {
  return String(value || "").toLowerCase().includes(String(expected || "").toLowerCase());
}

function scoreResult(fixture, result) {
  const errors = [];
  const exp = fixture.expect || {};

  if (result.mode !== exp.mode) {
    errors.push(`mode expected ${exp.mode}, got ${result.mode}`);
  }
  if (exp.target && result.targetId !== exp.target) {
    errors.push(`target expected ${exp.target}, got ${result.targetId}`);
  }
  if (exp.targetMustBeNull && result.targetId !== null) {
    errors.push(`target expected null, got ${result.targetId}`);
  }
  if (exp.offset != null && result.reminderOffsetMinutes !== exp.offset) {
    errors.push(
      `reminder offset expected ${exp.offset}, got ${result.reminderOffsetMinutes}`,
    );
  }
  if (exp.learningType && result.learningType !== exp.learningType) {
    errors.push(
      `learning type expected ${exp.learningType}, got ${result.learningType}`,
    );
  }
  if (exp.entityType && result.learningEntityType !== exp.entityType) {
    errors.push(
      `entity type expected ${exp.entityType}, got ${result.learningEntityType}`,
    );
  }
  if (exp.minItems != null && (result.items?.length || 0) < exp.minItems) {
    errors.push(
      `expected at least ${exp.minItems} created item(s), got ${result.items?.length || 0}`,
    );
  }
  if (exp.kind && result.items?.[0]?.kind !== exp.kind) {
    errors.push(
      `first created item kind expected ${exp.kind}, got ${result.items?.[0]?.kind}`,
    );
  }
  if (
    exp.titleIncludes &&
    !result.items?.some((item) =>
      includesCI(item.title || item.what || "", exp.titleIncludes),
    )
  ) {
    errors.push(`created title should include "${exp.titleIncludes}"`);
  }

  return errors;
}

async function evaluate(fixture) {
  const normalized =
    fixture.normalized || language.normalizeCasualIndonesian(fixture.message);
  const result = await ai.runAssistantTurn({
    rawMessage: fixture.message,
    normalizedMessage: normalized,
    workspaceContext: fixture.workspace || "",
    itemContext: fixture.items || [],
    recentConversation: fixture.recent || "",
  });
  const errors = scoreResult(fixture, result);
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
        who: item.who,
        when: item.when,
        where: item.where,
      })),
      reply: result.reply,
    },
    passed: errors.length === 0,
    errors,
  };
}

async function runPool(items, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        results[index] = await evaluate(items[index]);
        process.stdout.write(results[index].passed ? "." : "F");
      } catch (error) {
        results[index] = {
          id: items[index].id,
          critical: Boolean(items[index].critical),
          input: items[index].message,
          expected: items[index].expect,
          actual: null,
          passed: false,
          errors: [error instanceof Error ? error.message : String(error)],
        };
        process.stdout.write("E");
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.stdout.write("\n");
  return results;
}

(async () => {
  const startedAt = new Date().toISOString();
  console.log(
    `Running ${fixtures.length} live NANTI assistant evals with concurrency ${maxConcurrency}...`,
  );
  const results = await runPool(fixtures, maxConcurrency);
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const score = passed / results.length;
  const criticalFailures = results.filter(
    (result) => result.critical && !result.passed,
  );

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    model: process.env.GEMINI_MODEL || "default",
    total: results.length,
    passed,
    failed,
    score,
    minimumScore: minScore,
    criticalFailures: criticalFailures.map((result) => result.id),
    results,
  };

  const reportDir = path.join(root, "artifacts");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "assistant-live-eval.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

  console.log(
    `NANTI live eval: ${passed}/${results.length} passed (${(score * 100).toFixed(1)}%). Minimum: ${(minScore * 100).toFixed(0)}%.`,
  );

  for (const result of results.filter((item) => !item.passed)) {
    console.error(`\n[${result.id}] ${result.input}`);
    console.error(`  expected: ${JSON.stringify(result.expected)}`);
    console.error(`  actual:   ${JSON.stringify(result.actual)}`);
    for (const error of result.errors) console.error(`  - ${error}`);
  }

  if (criticalFailures.length) {
    console.error(
      `\nFAIL: critical assistant behaviors failed: ${criticalFailures
        .map((result) => result.id)
        .join(", ")}`,
    );
    process.exitCode = 1;
  } else if (score < minScore) {
    console.error(
      `\nFAIL: live assistant score ${(score * 100).toFixed(1)}% is below threshold ${(
        minScore * 100
      ).toFixed(0)}%.`,
    );
    process.exitCode = 1;
  } else {
    console.log("\nPASS: live assistant behavior benchmark met the quality bar.");
  }
})();