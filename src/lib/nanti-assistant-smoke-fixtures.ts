export type AssistantSmokeFixture = {
  id: string;
  critical?: boolean;
  always?: boolean;
  message: string;
  normalized?: string;
  workspace?: string;
  recent?: string;
  items?: Array<{
    id: string;
    title: string;
    kind: string;
    status: string;
    due?: string;
    time?: string;
    person?: string;
    project?: string;
    semantic?: unknown;
  }>;
  expect: {
    mode: string;
    target?: string;
    targetMustBeNull?: boolean;
    offset?: number;
    learningType?: string;
    entityType?: string;
    minItems?: number;
    kind?: string;
    titleIncludes?: string;
  };
};

function jakartaDate(offsetDays = 0, now = new Date()) {
  const shifted = new Date(now.getTime() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(shifted);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getAssistantSmokeFixtures(now = new Date()): AssistantSmokeFixture[] {
  const yesterday = jakartaDate(-1, now);
  const tomorrow = jakartaDate(1, now);
  return [
  {
    id: "smoke-answer-forgetting",
    critical: true,
    always: true,
    message: "what am i forgetting?",
    items: [
      { id: "t-over", title: "Bayar vendor", kind: "task", status: "open", due: yesterday },
      { id: "w-budi", title: "Tunggu approval PO", kind: "waiting", status: "open", person: "Budi" },
    ],
    workspace: "Bayar vendor overdue. Waiting for Budi approval.",
    expect: { mode: "answer" },
  },
  {
    id: "smoke-create-typo-puncak",
    critical: true,
    always: true,
    message: "Saya beosok harus oulang dr puncak jam 10 pagi",
    normalized: "Saya besok harus pulang dari puncak jam 10 pagi",
    expect: { mode: "create", minItems: 1, kind: "task", titleIncludes: "pulang" },
  },
  {
    id: "smoke-clarify-ambiguous-delete",
    critical: true,
    always: true,
    message: "hapus task budi",
    items: [
      { id: "t-b1", title: "Call Budi", kind: "task", status: "open", person: "Budi" },
      { id: "t-b2", title: "Kirim kontrak ke Budi", kind: "task", status: "open", person: "Budi" },
    ],
    expect: { mode: "clarify" },
  },
  {
    id: "smoke-reschedule-recent",
    message: "yang tadi jumat jam 3 aja",
    items: [
      { id: "t-recent", title: "Meeting Bu Rina", kind: "task", status: "open", due: tomorrow, time: "14:00" },
    ],
    recent: "user: meeting bu rina besok jam 2\nassistant: Saved Meeting Bu Rina.",
    expect: { mode: "reschedule", target: "t-recent" },
  },
  {
    id: "smoke-complete-invoice",
    message: "udah beres yg invoice",
    items: [
      { id: "t-inv", title: "Bayar invoice vendor", kind: "task", status: "open" },
    ],
    expect: { mode: "complete", target: "t-inv" },
  },
  {
    id: "smoke-reminder-offset",
    message: "remind gue 30 mnt sblm meeting bu rina",
    items: [
      { id: "t-rina", title: "Meeting Bu Rina", kind: "task", status: "open", due: tomorrow, time: "14:00" },
    ],
    expect: { mode: "set_reminder", target: "t-rina", offset: 30 },
  },
  {
    id: "smoke-waiting-status",
    critical: true,
    message: "pak b belum bales jadi gimana?",
    items: [
      { id: "w1", title: "Tunggu jawaban kontrak", kind: "waiting", status: "open", person: "Budi", semantic: { who: "Budi" } },
    ],
    workspace: "Budi aliases: Pak B. Waiting on Budi for contract response.",
    expect: { mode: "answer", targetMustBeNull: true },
  },
  {
    id: "smoke-followup-recorded",
    message: "gue udh follow up pak budi barusan",
    items: [
      { id: "w-budi", title: "Tunggu quotation", kind: "waiting", status: "open", person: "Pak Budi" },
    ],
    expect: { mode: "mark_followed_up", target: "w-budi" },
  },
  {
    id: "smoke-received",
    message: "revisinya udah dikirim sama mbak lia",
    items: [
      { id: "w-lia", title: "Tunggu revisi", kind: "waiting", status: "open", person: "Mbak Lia" },
    ],
    expect: { mode: "mark_received", target: "w-lia" },
  },
  {
    id: "smoke-teach-entity",
    message: "Pak B itu Budi",
    expect: { mode: "teach_language", learningType: "entity_alias", entityType: "person" },
  },
  {
    id: "smoke-create-waiting",
    message: "vendor bilang quotation dikirim besok, tolong catat gue nunggu",
    expect: { mode: "create", minItems: 1, kind: "waiting" },
  },
  {
    id: "smoke-answer-tomorrow",
    message: "besok ada apa aja?",
    items: [
      { id: "t1", title: "Meeting Bu Rina", kind: "task", status: "open", due: tomorrow, time: "14:00" },
    ],
    workspace: "Tomorrow: Meeting Bu Rina at 14:00.",
    expect: { mode: "answer" },
  },
  ];
}

export function selectDailyAssistantSmokeFixtures(now = new Date()) {
  const fixtures = getAssistantSmokeFixtures(now);
  const always = fixtures.filter((fixture) => fixture.always);
  const rotating = fixtures.filter((fixture) => !fixture.always);
  const dayIndex = Math.floor(now.getTime() / 86400000) % 3;
  const selected = rotating.filter((_, index) => index % 3 === dayIndex).slice(0, 3);
  return [...always, ...selected];
}
