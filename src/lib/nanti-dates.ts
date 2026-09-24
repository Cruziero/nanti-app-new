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

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const total = y! * 12 + (m! - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const day = Math.min(d!, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const PERIOD_DEFAULT_TIME: Record<string, string> = {
  pagi: "08:00",
  subuh: "05:00",
  siang: "12:00",
  sore: "17:00",
  malam: "20:00",
};

function parseTime(text: string): string | null {
  const normalize = (hourValue: string, minuteValue?: string, periodValue?: string) => {
    let hour = parseInt(hourValue, 10);
    const minute = minuteValue ? parseInt(minuteValue, 10) : 0;
    const period = (periodValue || "").toLowerCase();

    if (period === "sore" || period === "pm" || period === "siang" || period === "malam") {
      if (hour < 12) hour += 12;
      else if (period === "malam" && hour === 12) hour = 0;
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

  // Indonesian "setengah tiga" = half to three = 02:30
  const setengah = /\bsetengah\s+(\d{1,2})(?:\s*(pagi|siang|sore|malam|am|pm))?\b/i.exec(text);
  if (setengah) {
    return normalize(String(parseInt(setengah[1]!, 10) - 1), "30", setengah[2]);
  }

  const clock =
    /\b(\d{1,2})[.:](\d{2})(?:\s*(am|pm))?\b/i.exec(text);
  if (clock) return normalize(clock[1]!, clock[2], clock[3]);

  return null;
}

function parseMonthDay(
  text: string,
): { month: number; day: number | null; year?: number } | null {
  const lower = text.toLowerCase();

  // The day number must sit directly beside the month name ("28 agustus" / "agustus 28")
  // and the month must be a whole word. This stops an unrelated digit
  // ("jam 10 di bulan mei") from being read as a day, and stops "may" from matching
  // inside "maybe". An optional 4-digit year may follow: "28 agustus 2026".
  const tryMonths = (names: string[]) => {
    for (let i = 0; i < names.length; i++) {
      const name = names[i]!;
      const before = new RegExp(`\\b(\\d{1,2})\\s+${name}\\b(?:\\s+(\\d{4})\\b)?`).exec(lower);
      if (before) {
        return {
          month: i + 1,
          day: parseInt(before[1]!, 10),
          year: before[2] ? parseInt(before[2], 10) : undefined,
        };
      }
      const after = new RegExp(
        `\\b${name}\\b(?:\\s+(\\d{1,2})\\b)?(?:\\s+(\\d{4})\\b)?`,
      ).exec(lower);
      // Require a day or a year next to the month; a bare month ("saya suka mei")
      // is not a date.
      if (after && (after[1] !== undefined || after[2] !== undefined)) {
        return {
          month: i + 1,
          day: after[1] ? parseInt(after[1], 10) : null,
          year: after[2] ? parseInt(after[2], 10) : undefined,
        };
      }
    }
    return null;
  };

  const indonesian = tryMonths(MONTH_NAMES_ID);
  if (indonesian) return indonesian;

  const english = tryMonths(MONTH_NAMES_EN);
  if (english) return english;

  // Try "tanggal 28" with implied month
  const dateMatch = /tanggal\s+(\d{1,2})/.exec(lower);
  if (dateMatch) {
    return { month: -1, day: parseInt(dateMatch[1]!, 10) }; // month=-1 means current month
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
  const nantiPeriod = /\bnanti\s+(pagi|siang|sore|malam)\b/.exec(lower);
  if (nantiPeriod) {
    return {
      date: today,
      time: time || PERIOD_DEFAULT_TIME[nantiPeriod[1]!] || null,
      confidence: 0.9,
      raw: normalizedText,
    };
  }

  // "sore ini", "malam ini", "pagi ini" = today
  const iniPeriod = /\b(pagi|siang|sore|malam)\s+ini\b/.exec(lower);
  if (iniPeriod) {
    return {
      date: today,
      time: time || PERIOD_DEFAULT_TIME[iniPeriod[1]!] || null,
      confidence: 0.9,
      raw: normalizedText,
    };
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

  // "bulan depan" = same day next month
  if (/bulan\s+depan/.test(lower)) {
    return { date: addMonths(today, 1), time, confidence: 0.8, raw: normalizedText };
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

  // "tanggal 28", "28 agustus", "28 agustus 2026" — explicit dates win over weekday names
  const monthDay = parseMonthDay(lower);
  if (monthDay) {
    const impliedMonth = monthDay.month === -1;
    const explicitYear = monthDay.year;
    let m = impliedMonth ? new Date().getMonth() + 1 : monthDay.month;
    let y = explicitYear ?? year;
    const day = monthDay.day ?? 1;
    const build = () =>
      `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let dateStr = build();

    // Only roll forward when the user did not give an explicit year.
    // Day already passed: roll to next month (implied) or next year (explicit month)
    if (explicitYear === undefined && dateStr < today) {
      if (impliedMonth) {
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
      } else {
        y += 1;
      }
      dateStr = build();
    }

    // Day does not exist in that month (e.g. "31" in September): roll forward
    while (day > daysInMonth(y, m)) {
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      dateStr = build();
    }

    return { date: dateStr, time, confidence: impliedMonth ? 0.9 : 0.95, raw: normalizedText };
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
