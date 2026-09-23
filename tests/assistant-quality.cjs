const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const cache = new Map();

function load(filename) {
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
      return load(target);
    }
    return require(id);
  };

  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, {
    filename,
  })(localRequire, module, module.exports);
  return module.exports;
}

const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assistant-quality-fixtures.json"), "utf8"),
);
const language = load(path.join(root, "src/lib/nanti-language.ts"));
const dates = load(path.join(root, "src/lib/nanti-dates.ts"));
const importer = load(path.join(root, "src/lib/nanti-import.ts"));
const utils = load(path.join(root, "src/lib/nanti-utils.ts"));

let passed = 0;
const failures = [];

function check(fixture, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push({
      id: fixture.id,
      input: fixture.input,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

for (const fixture of fixtures.normalize) {
  check(fixture, () => {
    assert.equal(
      language.normalizeCasualIndonesian(fixture.input),
      fixture.expected,
      "normalized text mismatch",
    );
  });
}

for (const fixture of fixtures.dateTime) {
  check(fixture, () => {
    const result = dates.parseSmartDate(fixture.input);

    if (fixture.dateOffset != null) {
      assert.equal(
        result.date,
        utils.addDays(utils.todayISO(), fixture.dateOffset),
        `expected date offset ${fixture.dateOffset}`,
      );
    }
    if (fixture.date) {
      assert.equal(result.date, fixture.date, "exact date mismatch");
    }
    if (fixture.hasDate) {
      assert.ok(result.date, "expected a date");
    }
    if (fixture.weekday != null) {
      assert.ok(result.date, "expected weekday date");
      const [year, month, day] = result.date.split("-").map(Number);
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      assert.equal(weekday, fixture.weekday, "weekday mismatch");
      assert.ok(result.date > utils.todayISO(), "weekday result must be in the future");
    }
    if (fixture.time) {
      assert.equal(result.time, fixture.time, "time mismatch");
    }
  });
}

for (const fixture of fixtures.fallbackTask) {
  check(fixture, () => {
    const item = importer.chatMessageToFallbackItem(fixture.input, {
      people: [],
      projects: [],
    });
    assert.ok(item, "expected deterministic fallback task");

    if (fixture.titleIncludes) {
      assert.ok(
        item.title.toLowerCase().includes(fixture.titleIncludes.toLowerCase()),
        `title "${item.title}" should include "${fixture.titleIncludes}"`,
      );
    }
    if (fixture.time) {
      assert.equal(item.time, fixture.time, "task time mismatch");
    }
    if (fixture.person) {
      assert.equal(
        item.personName?.toLowerCase(),
        fixture.person.toLowerCase(),
        "person mismatch",
      );
    }
    if (fixture.where) {
      assert.equal(
        item.semanticContext?.where?.toLowerCase(),
        fixture.where.toLowerCase(),
        "location mismatch",
      );
    }
    if (fixture.how) {
      assert.equal(item.semanticContext?.how, fixture.how, "method mismatch");
    }
    if (fixture.reminderOffset != null) {
      assert.equal(
        item.semanticContext?.reminder?.offsetMinutes,
        fixture.reminderOffset,
        "reminder offset mismatch",
      );
    }
    if (fixture.typoCorrected != null) {
      assert.equal(
        item.semanticContext?.typoCorrected,
        fixture.typoCorrected,
        "typo-corrected flag mismatch",
      );
    }
    if (fixture.hasDue) {
      assert.ok(item.due, "expected due date");
    }
    assert.equal(item.quote, fixture.input, "raw quote must be preserved");
  });
}

for (const fixture of fixtures.rejectTask) {
  check(fixture, () => {
    const item = importer.chatMessageToFallbackItem(fixture.input, {
      people: [],
      projects: [],
    });
    assert.equal(item, null, "non-actionable text must not become fallback task");
  });
}

for (const fixture of fixtures.teaching) {
  check(fixture, () => {
    const learned = language.detectExplicitLanguageTeaching(fixture.input);
    if (fixture.expectNull) {
      assert.equal(learned, null, "ordinary statement must not become teaching");
      return;
    }

    assert.ok(learned, "expected explicit teaching");
    if (fixture.memoryType) {
      assert.equal(learned.memoryType, fixture.memoryType, "memory type mismatch");
    }
    if (fixture.entityType) {
      assert.equal(learned.entityType, fixture.entityType, "entity type mismatch");
    }
    if (fixture.pattern) {
      assert.equal(
        learned.pattern.toLowerCase(),
        fixture.pattern.toLowerCase(),
        "teaching pattern mismatch",
      );
    }
    if (fixture.meaning) {
      assert.equal(
        learned.meaning.toLowerCase(),
        fixture.meaning.toLowerCase(),
        "teaching meaning mismatch",
      );
    }
    if (fixture.offsetMinutes != null) {
      assert.equal(
        learned.offsetMinutes,
        fixture.offsetMinutes,
        "reminder teaching offset mismatch",
      );
    }
  });
}

assert.equal(
  passed + failures.length,
  fixtures.total,
  "fixture count must match declared total",
);

if (failures.length) {
  console.error(
    `FAIL: ${failures.length}/${fixtures.total} NANTI assistant quality fixtures failed.\n`,
  );
  for (const failure of failures) {
    console.error(`[${failure.id}] ${failure.input}\n  ${failure.error}\n`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `PASS: ${passed}/${fixtures.total} messy-chat quality fixtures passed across normalization, date/time, fallback task extraction, false-positive rejection, and teaching detection.`,
  );
}
