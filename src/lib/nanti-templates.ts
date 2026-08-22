import type { WhatsAppTemplate, ReminderItem, TaskItem } from "./nanti-types";

const templates: WhatsAppTemplate[] = [
  {
    id: "gentle-reminder",
    name: "Pengingat Lembut",
    body: "Hai {person_name}! 🌟\n\n{item_title}\n\n{due_info}\n\nNANTI mengingatkan Anda tentang ini. Semangat!",
    category: "reminder",
    variables: ["person_name", "item_title", "due_info"],
    tone: "friendly",
  },
  {
    id: "professional-reminder",
    name: "Pengingat Profesional",
    body: "Yth. {person_name},\n\nMohon perhatian untuk:\n{item_title}\n\n{due_info}\n\nTerima kasih.",
    category: "reminder",
    variables: ["person_name", "item_title", "due_info"],
    tone: "professional",
  },
  {
    id: "gentle-followup",
    name: "Follow-up Lembut",
    body: "Hai {person_name}! 👋\n\n{item_title}\n\n{wait_info}\n\nApakah ada kabar terbaru?",
    category: "followup",
    variables: ["person_name", "item_title", "wait_info"],
    tone: "friendly",
  },
  {
    id: "professional-followup",
    name: "Follow-up Profesional",
    body: "Yth. {person_name},\n\n{item_title}\n\n{wait_info}\n\nMohon update terkini.",
    category: "followup",
    variables: ["person_name", "item_title", "wait_info"],
    tone: "professional",
  },
  {
    id: "daily-briefing",
    name: "Briefing Harian",
    body: "☀️ Selamat pagi, {user_name}!\n\n📋 {date_label}\n\n{briefing_items}\n\n{overdue_section}{waiting_section}\n\nSemangat hari ini! 💪",
    category: "briefing",
    variables: ["user_name", "date_label", "briefing_items", "overdue_section", "waiting_section"],
    tone: "friendly",
  },
  {
    id: "payment-reminder",
    name: "Pengingat Pembayaran",
    body: "Hai {person_name},\n\n{item_title}\n\n{due_info}\n\n{amount_info}\n\nTerima kasih.",
    category: "reminder",
    variables: ["person_name", "item_title", "due_info", "amount_info"],
    tone: "professional",
  },
  {
    id: "meeting-reminder",
    name: "Pengingat Meeting",
    body: "Hai {person_name}! 📅\n\n{item_title}\n\n{due_info}\n\n{location_info}\n\nSee you there!",
    category: "reminder",
    variables: ["person_name", "item_title", "due_info", "location_info"],
    tone: "friendly",
  },
  {
    id: "task-overdue",
    name: "Tugas Terlambat",
    body: "⚠️ {person_name},\n\n{item_title}\n\n{overdue_info}\n\nMohon segera ditindaklanjuti.",
    category: "urgent",
    variables: ["person_name", "item_title", "overdue_info"],
    tone: "professional",
  },
];

export function getTemplates(category?: WhatsAppTemplate["category"]): WhatsAppTemplate[] {
  if (category) {
    return templates.filter((t) => t.category === category);
  }
  return templates;
}

export function getTemplate(id: string): WhatsAppTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function renderTemplate(templateId: string, variables: Record<string, string>): string {
  const template = getTemplate(templateId);
  if (!template) return "";

  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return body;
}

export function generateReminderMessage(
  item: TaskItem,
  personName: string,
  tone: "friendly" | "professional" = "friendly",
): string {
  const dueInfo = item.due
    ? `📅 Jatuh tempo: ${item.due}${item.time ? ` pukul ${item.time}` : ""}`
    : "📅 Belum ada tanggal jatuh tempo";

  const templateId = tone === "friendly" ? "gentle-reminder" : "professional-reminder";

  return renderTemplate(templateId, {
    person_name: personName,
    item_title: item.title,
    due_info: dueInfo,
  });
}

export function generateFollowUpMessage(
  item: TaskItem,
  personName: string,
  waitDays: number,
  tone: "friendly" | "professional" = "friendly",
): string {
  const waitInfo = `⏳ Sudah ${waitDays} hari menunggu`;

  const templateId = tone === "friendly" ? "gentle-followup" : "professional-followup";

  return renderTemplate(templateId, {
    person_name: personName,
    item_title: item.title,
    wait_info: waitInfo,
  });
}

export function generateBriefingMessage(
  userName: string,
  dateLabel: string,
  items: TaskItem[],
  overdueCount: number,
  waitingCount: number,
): string {
  const briefingItems = items
    .map((item, i) => {
      const emoji = item.kind === "commitment" ? "🤝" : item.kind === "waiting" ? "⏳" : "📌";
      const due = item.due ? ` (${item.due})` : "";
      return `${i + 1}. ${emoji} ${item.title}${due}`;
    })
    .join("\n");

  const overdueSection = overdueCount > 0 ? `\n⚠️ ${overdueCount} tugas terlambat\n` : "";

  const waitingSection = waitingCount > 0 ? `\n⏳ ${waitingCount} hal menunggu` : "";

  return renderTemplate("daily-briefing", {
    user_name: userName,
    date_label: dateLabel,
    briefing_items: briefingItems || "Tidak ada item hari ini",
    overdue_section: overdueSection,
    waiting_section: waitingSection,
  });
}

export function generatePaymentReminder(
  item: TaskItem,
  personName: string,
  amount?: string,
): string {
  const dueInfo = item.due ? `📅 Jatuh tempo: ${item.due}` : "📅 Belum ada tanggal jatuh tempo";

  const amountInfo = amount ? `💰 Jumlah: ${amount}` : "";

  return renderTemplate("payment-reminder", {
    person_name: personName,
    item_title: item.title,
    due_info: dueInfo,
    amount_info: amountInfo,
  });
}

export function generateMeetingReminder(
  item: TaskItem,
  personName: string,
  location?: string,
): string {
  const dueInfo = item.due
    ? `📅 ${item.due}${item.time ? ` pukul ${item.time}` : ""}`
    : "📅 Belum ada waktu";

  const locationInfo = location ? `📍 ${location}` : "";

  return renderTemplate("meeting-reminder", {
    person_name: personName,
    item_title: item.title,
    due_info: dueInfo,
    location_info: locationInfo,
  });
}

export function generateUrgentAlert(item: TaskItem, personName: string): string {
  const overdueInfo = item.due ? `⏰ Terlambat sejak ${item.due}` : "⏰ Sudah melewati batas waktu";

  return renderTemplate("task-overdue", {
    person_name: personName,
    item_title: item.title,
    overdue_info: overdueInfo,
  });
}
