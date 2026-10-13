const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const settings = read("src/routes/app.settings.tsx");
const flags = read("src/lib/nanti-launch-flags.ts");
const reminders = read("src/routes/api/cron/check-reminders.tsx");
const calendarCron = read("src/routes/api/cron/sync-calendar.tsx");
const calendar = read("src/lib/nanti-calendar.functions.ts");
const whatsapp = read("src/lib/nanti-whatsapp.ts");
const home = read("src/routes/index.tsx");
const rootRoute = read("src/routes/__root.tsx");
const manifest = JSON.parse(read("public/manifest.webmanifest"));

assert.match(flags, /VITE_WHATSAPP_LAUNCH_ENABLED/);
assert.match(flags, /VITE_CALENDAR_LAUNCH_ENABLED/);
assert.match(flags, /VITE_PUSH_LAUNCH_ENABLED/);

assert.match(settings, /NANTI_LAUNCH_FLAGS/);
assert.doesNotMatch(settings, /const WHATSAPP_LAUNCH_ENABLED = false/);
assert.doesNotMatch(settings, /const CALENDAR_LAUNCH_ENABLED = false/);
assert.doesNotMatch(settings, /const PUSH_LAUNCH_ENABLED = false/);

assert.match(reminders, /VITE_WHATSAPP_LAUNCH_ENABLED/);
assert.match(reminders, /VITE_PUSH_LAUNCH_ENABLED/);
assert.match(calendarCron, /VITE_CALENDAR_LAUNCH_ENABLED/);

assert.match(calendar, /VITE_SITE_URL/);
assert.match(calendar, /calendarAppOrigin/);
assert.doesNotMatch(calendar, /data\.origin\.replace\(\/\\\/\$\//);

assert.match(whatsapp, /WHATSAPP_GRAPH_VERSION/);
assert.match(whatsapp, /v26\.0/);
assert.match(whatsapp, /to_number/);
assert.match(whatsapp, /external_message_id/);
assert.doesNotMatch(whatsapp, /phone_number:/);
assert.doesNotMatch(whatsapp, /wa_message_id/);

assert.match(rootRoute, /manifest\.webmanifest/);
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/app");

assert.doesNotMatch(home, /Free forever/i);
assert.doesNotMatch(home, /Lockscreen\s*&amp;\s*Home Widget/i);
assert.doesNotMatch(home, /Forward a WhatsApp message\./i);
assert.match(flags, /Private beta/);
assert.match(home, /Home Screen \+ Push/);

console.log("PASS: integration readiness guardrails are configured.");
