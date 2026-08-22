import type { Item, Person, ClarificationRequest } from "./nanti-types";
import { dayDiff, todayISO, addDays } from "./nanti-utils";

export interface FollowUpSuggestion {
  itemId: string;
  type: "overdue_commitment" | "waiting_no_response" | "potentially_forgotten" | "stale_waiting";
  title: string;
  personName?: string;
  daysSince: number;
  suggestedAction: string;
  draftMessage?: string;
}

export function detectFollowUps(items: Item[], people: Person[]): FollowUpSuggestion[] {
  const suggestions: FollowUpSuggestion[] = [];
  const openItems = items.filter((i) => i.status === "open");
  const today = todayISO();

  for (const item of openItems) {
    if (item.kind === "waiting" && item.since) {
      const days = Math.abs(dayDiff(item.since) ?? 0);
      if (days >= 2) {
        const person = people.find((p) => p.id === item.personId);
        suggestions.push({
          itemId: item.id,
          type: days >= 4 ? "stale_waiting" : "waiting_no_response",
          title: item.title,
          personName: person?.name || item.personName,
          daysSince: days,
          suggestedAction: `Sudah ${days} hari menunggu${person?.name ? ` dari ${person.name}` : ""}`,
        });
      }
    }

    if (item.kind === "commitment" && item.due && item.status === "open") {
      const diff = dayDiff(item.due);
      if (diff !== undefined && diff < 0) {
        const person = people.find((p) => p.id === item.personId);
        suggestions.push({
          itemId: item.id,
          type: "overdue_commitment",
          title: item.title,
          personName: person?.name || item.personName,
          daysSince: Math.abs(diff),
          suggestedAction: `Tenggat ${Math.abs(diff)} hari yang lalu`,
        });
      }
    }

    // Check for items due soon without recent activity
    if (item.due && item.status === "open") {
      const diff = dayDiff(item.due);
      if (diff !== undefined && diff >= 0 && diff <= 1 && item.kind !== "waiting") {
        // Check if this was created more than 2 days ago with no updates
        const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        const nowMs = Date.now();
        if (created > 0 && nowMs - created > 2 * 86400000) {
          suggestions.push({
            itemId: item.id,
            type: "potentially_forgotten",
            title: item.title,
            personName: people.find((p) => p.id === item.personId)?.name || item.personName,
            daysSince: Math.floor((nowMs - created) / 86400000),
            suggestedAction: "Mungkin sudah dilupakan",
          });
        }
      }
    }
  }

  return suggestions.sort((a, b) => {
    const priority: Record<string, number> = {
      overdue_commitment: 0,
      stale_waiting: 1,
      waiting_no_response: 2,
      potentially_forgotten: 3,
    };
    return (priority[a.type] ?? 99) - (priority[b.type] ?? 99);
  });
}

export function generateFollowUpMessage(
  suggestion: FollowUpSuggestion,
  tone: "formal" | "professional" | "casual" | "friendly" | "warm" | "direct",
): string {
  const name = suggestion.personName || "Bapak/Ibu";
  const what = suggestion.title;

  switch (tone) {
    case "formal":
      return `Selamat siang ${name}, saya ingin menindaklanjuti terkait "${what}". Mohon kabarnya apabila sudah ada perkembangan. Terima kasih.`;
    case "professional":
      return `Halo ${name}, follow up sedikit soal "${what}". Kalau sudah ada update, kabarin saya ya.`;
    case "casual":
      return `Hi ${name}, mau follow up soal "${what}" nih. Gimana kabarnya? 🙏`;
    case "friendly":
      return `Halo ${name}! 😊 just checking in on "${what}". Ada update?`;
    case "warm":
      return `${name}, just a gentle reminder about "${what}". No rush, just want to make sure it's on your radar. 🤍`;
    case "direct":
      return `${name} — "${what}" follow up needed. Status?`;
    default:
      return `Halo ${name}, follow up soal "${what}".`;
  }
}
