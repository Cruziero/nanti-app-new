import { addDays, todayISO, TIMEZONE } from "./nanti-utils";
import { normalizeCasualIndonesian } from "./nanti-language";

const DAY_NAMES_ID = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
const DAY_NAMES_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTH_NAMES_ID = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];
const MONTH_NAMES_EN = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export interface DateParseResult {
  date: string | null;
  time: string | null;
  confidence: number;
  raw: string;
}

function getCurrentYear(): number {
  const d = new Date();
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, year: "numeric" }).format(d),
  );
}

function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

function getNextWeekday(targetDay: number): string {
  const today = todayISO();
  const current = getDayOfWeek(today);
  let diff = targetDay - current;
  if (diff <= 0) diff += 7;
  return addDays(today, diff);
}

function parseTime(text: string): string | null {
  const normalize = (hourValue: string, minuteValue?: string, periodValue?: string) => {
    let hour = parseInt(hourValue, 10);
    const minute = minuteValue ? parseInt(minuteValue, 10) : 0;
    const period = (periodValue || "").toLowerCase();

    if (period === "sore" || period === "pm" || period === "siang" || period === "malam") {
      if (hour < 12) hour += 12;
    } else if (period === "pagi" || period === "am") {
      if (hour === 12) hour = 0;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const labelled =
    /\b(?:jam|pukul)\s+(\d{1,2})(?:[.:](\d{2}))?(?:\s*(pagi|siang|sore|malam|am|pm))?\b/i.exec(
      text,
    );
  if (labelled) return normalize(labelled[1]!, labelled[2], labelled[3]);

  const clock =
    /\b(\d{1,2})[.:](\d{2})(?:\s*(am|pm))?\b/i.exec(text);
  if (clock) return normalize(clock[1]!, clock[2], clock[3]);

  return null;
}

function parseMonthDay(text: string): { month: number; day: number } | null {
  const lower = text.toLowerCase();

  // Try Indonesian: "28 agustus", "tanggal 28 agustus", "28 agustus 2026"
  for (let i = 0; i < MONTH_NAMES_ID.length; i++) {
    if (lower.includes(MONTH_NAMES_ID[i]!)) {
      const dayMatch = /(\d{1,2})/.exec(lower.replace(MONTH_NAMES_ID[i]!, ""));
      if (dayMatch) {
        return { month: i + 1, day: parseInt(dayMatch[1], 10) };
      }
    }
  }

  // Try English: "august 28", "28 august"
  for (let i = 0; i < MONTH_NAMES_EN.length; i++) {
    if (lower.includes(MONTH_NAMES_EN[i]!)) {
      const dayMatch = /(\d{1,2})/.exec(lower.replace(MONTH_NAMES_EN[i]!, ""));
      if (dayMatch) {
        return { month: i + 1, day: parseInt(dayMatch[1], 10) };
      }
    }
  }

  // Try "tanggal 28" or just "28" with implied month
  const dateMatch = /tanggal\s+(\d{1,2})/.exec(lower);
  if (dateMatch) {
    return { month: -1, day: parseInt(dateMatch[1], 10) }; // month=-1 means current month
  }

  return null;
}

export function parseIndonesianDate(text: string): DateParseResult {
  const normalizedText = normalizeCasualIndonesian(text);
  const lower = normalizedText.toLowerCase().trim();
  const today = todayISO();
  const year = getCurrentYear();
  const time = parseTime(normalizedText);

  // "hari ini"
  if (/\bhari\s+ini\b/.test(lower)) {
    return { date: today, time, confidence: 1.0, raw: normalizedText };
  }

  // "besok" and common chat shorthand ("bsk")
  if (/\b(besok|bsk)\b/.test(lower)) {
    return { date: addDays(today, 1), time, confidence: 1.0, raw: normalizedText };
  }

  // "lusa"
  if (/\blusa\b/.test(lower)) {
    return { date: addDays(today, 2), time, confidence: 1.0, raw: normalizedText };
  }

  // "nanti sore", "nanti malam", "nanti pagi" = today
  if (/\bnanti\s+(sore|malam|pagi)\b/.test(lower)) {
    return { date: today, time: time || "17:00", confidence: 0.9, raw: normalizedText };
  }

  // "3 hari lagi", "5 hari lagi"
  const daysLaterMatch = /(\d+)\s+hari\s+lagi/.exec(lower);
  if (daysLaterMatch) {
    const days = parseInt(daysLaterMatch[1], 10);
    return { date: addDays(today, days), time, confidence: 0.95, raw: normalizedText };
  }

  // "minggu depan" = next week same day
  if (/minggu\s+depan/.test(lower)) {
    return { date: addDays(today, 7), time, confidence: 0.85, raw: normalizedText };
  }

  // "akhir bulan" = last day of current month
  if (/akhir\s+bul(an)?/.test(lower)) {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
    return { date: lastDayStr, time, confidence: 0.85, raw: normalizedText };
  }

  // "awal bulan" = 1st of current month
  if (/awal\s+bul(an)?/.test(lower)) {
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return { date: firstDay, time, confidence: 0.85, raw: normalizedText };
  }

  // Day name: "jumat", "senin depan", "jumat ini"
  for (let i = 0; i < DAY_NAMES_ID.length; i++) {
    if (lower.includes(DAY_NAMES_ID[i]!)) {
      const nextMatch = /depan/.test(lower);
      let targetDate: string;
      if (nextMatch) {
        const today_dow = getDayOfWeek(today);
        let diff = i - today_dow;
        if (diff <= 0) diff += 7;
        targetDate = addDays(today, diff + 7); // next week
      } else {
        targetDate = getNextWeekday(i);
      }
      return { date: targetDate, time, confidence: 0.85, raw: normalizedText };
    }
  }

  // English day names
  for (let i = 0; i < DAY_NAMES_EN.length; i++) {
    if (lower.includes(DAY_NAMES_EN[i]!)) {
      const targetDate = getNextWeekday(i);
      return { date: targetDate, time, confidence: 0.85, raw: normalizedText };
    }
  }

  // "tanggal 28", "28 agustus", "28 agustus 2026"
  const monthDay = parseMonthDay(lower);
  if (monthDay) {
    let m = monthDay.month;
    if (m === -1) {
      m = new Date().getMonth() + 1; // current month
    }
    const y = year;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(monthDay.day).padStart(2, "0")}`;
    // If date is in the past, assume next year
    if (dateStr < today) {
      return {
        date: `${y + 1}-${String(m).padStart(2, "0")}-${String(monthDay.day).padStart(2, "0")}`,
        time,
        confidence: 0.9,
        raw: normalizedText,
      };
    }
    return { date: dateStr, time, confidence: 0.95, raw: normalizedText };
  }

  // ISO date pattern
  const isoMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(normalizedText);
  if (isoMatch) {
    return {
      date: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      time,
      confidence: 1.0,
      raw: normalizedText,
    };
  }

  return { date: null, time, confidence: 0, raw: normalizedText };
}

export function parseSmartDate(text: string): DateParseResult {
  return parseIndonesianDate(text);
}
