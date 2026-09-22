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
      const target = ["", ".ts", ".tsx"].map((ext) => base + ext).find((file) =>
        fs.existsSync(file) && fs.statSync(file).isFile(),
      );
      if (!target) throw new Error(`Cannot resolve ${id} from ${filename}`);
      return load(target);
    }
    return require(id);
  };

  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}

const language = load(path.join(root, "src/lib/nanti-language.ts"));
const dates = load(path.join(root, "src/lib/nanti-dates.ts"));
const importer = load(path.join(root, "src/lib/nanti-import.ts"));

const raw = "Saya beosok harus oulang dr puncak jam 10 pagi";
const normalized = language.normalizeCasualIndonesian(raw);
assert.equal(normalized.toLowerCase(), "saya besok harus pulang dari puncak jam 10 pagi");
assert.equal(language.normalizeActionTitle(raw).toLowerCase(), "pulang dari puncak");

const parsed = dates.parseSmartDate(raw);
assert.ok(parsed.date, "tomorrow should be detected");
assert.equal(parsed.time, "10:00");

const item = importer.chatMessageToFallbackItem(raw, { people: [], projects: [] });
assert.ok(item, "explicit self-action should become a task");
assert.equal(item.title.toLowerCase(), "pulang dari puncak");
assert.equal(item.time, "10:00");
assert.equal(item.quote, raw);
assert.equal(item.semanticContext?.who, "user");
assert.equal(item.semanticContext?.where?.toLowerCase(), "puncak");
assert.equal(item.semanticContext?.reminder?.offsetMinutes, 60);
assert.equal(item.semanticContext?.typoCorrected, true);
assert.ok(item.reminderTime, "travel task should get a reminder");
assert.equal(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(item.reminderTime)),
  "09:00",
);

assert.equal(language.normalizeCasualIndonesian("ulang meeting"), "ulang meeting");
assert.equal(
  language.normalizedIntentText("Whatt am I forgeting?"),
  "what am i forgetting",
);

console.log("PASS: typo normalization, semantic extraction fallback, location/time and reminder strategy.");
