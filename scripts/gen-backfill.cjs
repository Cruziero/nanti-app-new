const fs = require("fs");

const src = "supabase/migrations/";
const files = [
  "20260822000000_add_reminders_invoices_calendar_whatsapp.sql",
  "20260907_create_blog_articles.sql",
  "20260907_seed_blog_articles.sql",
];

const out = [];
out.push("-- NANTI manual backfill: the two migrations that never ran on this project.");
out.push("-- Generated 2026-09-25 from supabase/migrations/. Safe to run repeatedly.");
out.push("-- Diff vs original: CREATE INDEX -> IF NOT EXISTS, CREATE POLICY preceded by DROP POLICY IF EXISTS.");
out.push("-- Everything else is byte-identical to the committed migration.");
out.push("");

files.forEach((f) => {
  out.push("-- ============================================================");
  out.push("-- " + f);
  out.push("-- ============================================================");
  const lines = fs.readFileSync(src + f, "utf8").split(/\r?\n/);
  lines.forEach((l) => {
    const t = l.trim();
    let line = l;
    if (/^create index /i.test(t)) {
      line = l.replace(/^create index /i, "create index if not exists ");
    }
    if (/^create policy /i.test(t)) {
      const pm = t.match(/^create policy "([^"]+)" on (?:public\.)?([a-z_0-9]+)/i);
      if (pm) out.push('drop policy if exists "' + pm[1] + '" on ' + pm[2] + ";");
    }
    out.push(line);
  });
  out.push("");
});

fs.mkdirSync("supabase/manual", { recursive: true });
const dest = "supabase/manual/20260925_backfill_missing_tables.sql";
fs.writeFileSync(dest, out.join("\n"));

const txt = fs.readFileSync(dest, "utf8");
const body = txt.split("\n").filter((l) => !l.trim().startsWith("--"));
const guardedIdx = body.filter((l) => /^create index\s+if\s+not\s+exists/i.test(l.trim())).length;
const bareIdx = body.filter((l) => /^create index\s+(?!if\s)/i.test(l.trim())).length;
const creates = body.filter((l) => /^create policy/i.test(l.trim())).length;
const drops = body.filter((l) => /^drop policy if exists/i.test(l.trim())).length;
let dropFirst = true;
body.forEach((l, i) => {
  if (!/^create policy/i.test(l.trim())) return;
  let j = i - 1;
  while (j >= 0 && (/^\s*$/.test(body[j]) || /^\s*--/.test(body[j]))) j--;
  if (j < 0 || !/^drop policy if exists/i.test(body[j].trim())) dropFirst = false;
});
console.log("written " + dest);
console.log("index guarded: " + guardedIdx + ", unguarded: " + bareIdx);
console.log("policy: " + creates + " creates / " + drops + " drops");
console.log("every create preceded by drop: " + dropFirst);
