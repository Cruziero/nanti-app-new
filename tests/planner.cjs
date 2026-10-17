const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, "../src/lib/nanti-planner.ts"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

const mod = {};
vm.runInNewContext(source, {
  exports: mod,
  Date,
  Math,
  String,
  Number,
  Array,
  Object,
});
const { planDay, toMinutes } = mod;

function mins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(a, b) {
  return mins(a.start) < mins(b.end) && mins(b.start) < mins(a.end);
}

const NOW_MIDDAY = new Date(2026, 9, 13, 14, 47);
const TODAY = "2026-10-13";

function task(overrides) {
  return {
    id: `t${Math.random().toString(36).slice(2, 9)}`,
    title: "Untitled",
    status: "open",
    ...overrides,
  };
}

test("anchors keep the time the user already set", () => {
  const plan = planDay(
    [task({ id: "a", title: "Standup", time: "14:00" }), task({ id: "b", title: "Call" })],
    { now: NOW_MIDDAY, today: TODAY },
  );

  const anchor = plan.blocks.find((b) => b.itemId === "a");
  assert.ok(anchor, "anchor block present");
  assert.equal(anchor.start, "14:00");
  assert.equal(anchor.end, "14:30");
  assert.equal(anchor.fixed, true);
  assert.equal(anchor.reason, "You set 14:00");
  assert.equal(plan.anchorCount, 1);
});

test("overdue beats due-today beats upcoming beats undated", () => {
  const plan = planDay(
    [
      task({ id: "undated", title: "Sort desk" }),
      task({ id: "upcoming", title: "Renew permit", due: "2026-11-02" }),
      task({ id: "today", title: "Send invoice", due: TODAY }),
      task({ id: "overdue", title: "File tax", due: "2026-10-01" }),
    ],
    { now: NOW_MIDDAY, today: TODAY },
  );

  assert.deepEqual(Array.from(plan.blocks.map((b) => b.itemId)), [
    "overdue",
    "today",
    "upcoming",
    "undated",
  ]);
});

test("upcoming items are ordered soonest due first", () => {
  const plan = planDay(
    [
      task({ id: "far", title: "Far", due: "2026-12-20" }),
      task({ id: "near", title: "Near", due: "2026-10-20" }),
    ],
    { now: NOW_MIDDAY, today: TODAY },
  );

  assert.deepEqual(Array.from(plan.blocks.map((b) => b.itemId)), ["near", "far"]);
});

test("priority breaks the tie when two items share a due date", () => {
  const plan = planDay(
    [
      task({ id: "low", title: "Nice to have", due: TODAY, priority: "low" }),
      task({ id: "crit", title: "Ship it", due: TODAY, priority: "critical" }),
      task({ id: "high", title: "Almost", due: TODAY, priority: "high" }),
    ],
    { now: NOW_MIDDAY, today: TODAY },
  );

  assert.deepEqual(Array.from(plan.blocks.map((b) => b.itemId)), ["crit", "high", "low"]);
});

test("no block ever overlaps another", () => {
  const plan = planDay(
    [
      task({ id: "anchor", title: "Anchor", time: "15:30" }),
      task({ id: "a", title: "A" }),
      task({ id: "b", title: "B", due: TODAY }),
      task({ id: "c", title: "C", due: "2026-10-01" }),
      task({ id: "d", title: "D" }),
      task({ id: "e", title: "E", priority: "high" }),
    ],
    { now: NOW_MIDDAY, today: TODAY },
  );

  for (let i = 0; i < plan.blocks.length; i += 1) {
    for (let j = i + 1; j < plan.blocks.length; j += 1) {
      assert.equal(
        overlaps(plan.blocks[i], plan.blocks[j]),
        false,
        `${plan.blocks[i].title} overlaps ${plan.blocks[j].title}`,
      );
    }
  }
});

test("nothing is scheduled before the current time", () => {
  const plan = planDay([task({ id: "a", title: "A" }), task({ id: "b", title: "B" })], {
    now: NOW_MIDDAY,
    today: TODAY,
  });

  for (const block of plan.blocks) {
    assert.ok(mins(block.start) >= mins("14:45"), `${block.start} starts before now`);
  }
});

test("an anchor in the past stays put and does not push flexible items backwards", () => {
  const plan = planDay(
    [task({ id: "past", title: "Morning call", time: "09:30" }), task({ id: "a", title: "A" })],
    { now: NOW_MIDDAY, today: TODAY },
  );

  const anchor = plan.blocks.find((b) => b.itemId === "past");
  assert.equal(anchor.start, "09:30");

  const flexible = plan.blocks.find((b) => b.itemId === "a");
  assert.ok(mins(flexible.start) >= mins("14:45"));
  assert.equal(overlaps(anchor, flexible), false);
});

test("every block stays inside the work window", () => {
  const plan = planDay(
    Array.from({ length: 12 }, (_, i) => task({ id: `t${i}`, title: `Task ${i}` })),
    { now: new Date(2026, 9, 13, 8, 5), today: TODAY },
  );

  assert.ok(plan.blocks.length > 0, "some tasks were placed");
  for (const block of plan.blocks) {
    assert.ok(mins(block.start) >= mins(plan.windowStart), `${block.start} before window`);
    assert.ok(mins(block.end) <= mins(plan.windowEnd), `${block.end} after window`);
  }
});

test("tasks that do not fit are reported back, never dropped", () => {
  const plan = planDay(
    [
      task({ id: "a", title: "A" }),
      task({ id: "b", title: "B" }),
      task({ id: "c", title: "C" }),
      task({ id: "d", title: "D" }),
      task({ id: "e", title: "E" }),
      task({ id: "f", title: "F" }),
      task({ id: "g", title: "G" }),
      task({ id: "h", title: "H" }),
      task({ id: "i", title: "I" }),
      task({ id: "j", title: "J" }),
    ],
    { now: NOW_MIDDAY, today: TODAY, windowEnd: "16:00" },
  );

  assert.ok(plan.unscheduled.length > 0, "leftover tasks are surfaced");
  for (const left of plan.unscheduled) {
    assert.equal(left.reason, "No room left before 16:00");
    assert.ok(left.itemId && left.title);
  }
  assert.equal(
    plan.blocks.length + plan.unscheduled.length,
    10,
    "every input item is accounted for",
  );
});

test("a closed window schedules nothing and says why", () => {
  const plan = planDay([task({ id: "a", title: "A" })], {
    now: new Date(2026, 9, 13, 19, 30),
    today: TODAY,
  });

  assert.equal(plan.blocks.length, 0);
  assert.equal(plan.unscheduled.length, 1);
  assert.equal(plan.unscheduled[0].reason, "No room left before 18:00");
});

test("empty input returns an empty plan", () => {
  const plan = planDay([], { now: NOW_MIDDAY, today: TODAY });
  assert.equal(plan.blocks.length, 0);
  assert.equal(plan.unscheduled.length, 0);
  assert.equal(plan.anchorCount, 0);
  assert.equal(plan.flexibleCount, 0);
});

test("done, waiting and inbox items are not scheduled", () => {
  const plan = planDay(
    [
      task({ id: "done", title: "Finished", status: "done" }),
      task({ id: "waiting", title: "On Nadia", kind: "waiting" }),
      task({ id: "inbox", title: "Unread", status: "inbox" }),
      task({ id: "keep", title: "Real work" }),
    ],
    { now: NOW_MIDDAY, today: TODAY },
  );

  assert.deepEqual(Array.from(plan.blocks.map((b) => b.itemId)), ["keep"]);
});

test("every reason is human and free of em dashes", () => {
  const plan = planDay(
    [
      task({ id: "a", title: "A", time: "16:00" }),
      task({ id: "b", title: "B", due: "2026-10-01" }),
      task({ id: "c", title: "C", due: TODAY, priority: "high" }),
      task({ id: "d", title: "D" }),
      task({ id: "e", title: "E", due: "2026-11-30" }),
    ],
    { now: NOW_MIDDAY, today: TODAY },
  );

  const reasons = plan.blocks.map((b) => b.reason);
  for (const reason of reasons) {
    assert.ok(reason.length > 0, "reason present");
    assert.equal(/[—\u2014]/.test(reason), false, `em dash in "${reason}"`);
  }
  assert.ok(reasons.includes("You set 16:00"));
  assert.ok(reasons.includes("Overdue, so it comes first"));
  assert.ok(reasons.includes("Due today, marked high"));
  assert.ok(reasons.includes("No deadline, so it takes the gap"));
  assert.ok(reasons.some((r) => /^Due \d{2} [A-Z][a-z]{2}$/.test(r)));
});

test("block boundaries round to whole minutes and stay valid", () => {
  const plan = planDay([task({ id: "a", title: "A" })], {
    now: new Date(2026, 9, 13, 9, 0),
    today: TODAY,
  });

  const block = plan.blocks[0];
  assert.match(block.start, /^\d{2}:\d{2}$/);
  assert.match(block.end, /^\d{2}:\d{2}$/);
  assert.equal(mins(block.end) - mins(block.start), 30);
});

test("custom block length is honoured", () => {
  const plan = planDay([task({ id: "a", title: "A" })], {
    now: new Date(2026, 9, 13, 9, 0),
    today: TODAY,
    blockMinutes: 60,
  });

  assert.equal(plan.blockMinutes, 60);
  assert.equal(mins(plan.blocks[0].end) - mins(plan.blocks[0].start), 60);
});

test("toMinutes rejects malformed and out-of-range times", () => {
  assert.equal(toMinutes("09:30"), 570);
  assert.equal(toMinutes(" 9:05 "), 545);
  assert.equal(toMinutes("24:00"), -1);
  assert.equal(toMinutes("12:60"), -1);
  assert.equal(toMinutes("half past"), -1);
  assert.equal(toMinutes(""), -1);
  assert.equal(toMinutes(null), -1);
  assert.equal(toMinutes(undefined), -1);
});

test("two anchors that cover the same time are reported as a conflict", () => {
  const plan = planDay(
    [
      task({ id: "standup", title: "Standup", time: "09:30" }),
      task({ id: "review", title: "Review", time: "09:45" }),
    ],
    { now: new Date(2026, 9, 13, 8, 0), today: TODAY },
  );

  assert.equal(plan.conflicts.length, 1);
  const clash = plan.conflicts[0];
  assert.equal(clash.itemId, "standup");
  assert.equal(clash.start, "09:30");
  assert.equal(clash.end, "10:00");
  assert.equal(clash.otherItemId, "review");
  assert.equal(clash.otherStart, "09:45");
  assert.equal(clash.reason, "Both times were set by hand, so they were left as they are.");
});

test("anchors that end where the next begins are not a conflict", () => {
  const plan = planDay(
    [
      task({ id: "a", title: "A", time: "09:00" }),
      task({ id: "b", title: "B", time: "09:30" }),
      task({ id: "c", title: "C", time: "10:00" }),
    ],
    { now: new Date(2026, 9, 13, 8, 0), today: TODAY },
  );

  assert.equal(plan.conflicts.length, 0);
});

test("a flexible task placed around an anchor is never a conflict", () => {
  const plan = planDay(
    [task({ id: "anchor", title: "Anchor", time: "15:00" }), task({ id: "flex", title: "Flex" })],
    { now: NOW_MIDDAY, today: TODAY },
  );

  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.anchorCount, 1);
  assert.equal(plan.flexibleCount, 1);
});

test("every clashing pair is reported once, in start order", () => {
  const plan = planDay(
    [
      task({ id: "c", title: "Third", time: "10:15" }),
      task({ id: "a", title: "First", time: "10:00" }),
      task({ id: "b", title: "Second", time: "10:10" }),
    ],
    { now: new Date(2026, 9, 13, 8, 0), today: TODAY },
  );

  const pairs = plan.conflicts.map((clash) => `${clash.itemId}/${clash.otherItemId}`);
  assert.deepEqual(Array.from(pairs), ["a/b", "a/c", "b/c"]);
});

test("a conflict never moves the blocks the user set", () => {
  const plan = planDay(
    [
      task({ id: "a", title: "A", time: "09:00" }),
      task({ id: "b", title: "B", time: "09:15" }),
    ],
    { now: new Date(2026, 9, 13, 8, 0), today: TODAY },
  );

  assert.equal(plan.conflicts.length, 1);
  const a = plan.blocks.find((block) => block.itemId === "a");
  const b = plan.blocks.find((block) => block.itemId === "b");
  assert.equal(a.start, "09:00");
  assert.equal(b.start, "09:15");
  assert.equal(a.fixed, true);
  assert.equal(b.fixed, true);
});

test("conflict reasons are human and free of em dashes", () => {
  const plan = planDay(
    [task({ id: "a", title: "A", time: "09:00" }), task({ id: "b", title: "B", time: "09:10" })],
    { now: new Date(2026, 9, 13, 8, 0), today: TODAY },
  );

  assert.ok(plan.conflicts.length > 0);
  for (const clash of plan.conflicts) {
    assert.ok(clash.reason.length > 0, "reason present");
    assert.equal(/[—\u2014]/.test(clash.reason), false, `em dash in "${clash.reason}"`);
  }
});

test("a clash inside a single-item day is not a conflict", () => {
  const plan = planDay([task({ id: "a", title: "A", time: "09:00" })], {
    now: new Date(2026, 9, 13, 8, 0),
    today: TODAY,
  });

  assert.equal(plan.conflicts.length, 0);
});
