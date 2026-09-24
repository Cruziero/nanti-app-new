const EXPANSIONS: Record<string, string> = {
  dr: "dari",
  dgn: "dengan",
  dg: "dengan",
  utk: "untuk",
  sy: "saya",
  aq: "aku",
  hrs: "harus",
  mst: "mesti",
  bsk: "besok",
  beosok: "besok",
  oulang: "pulang",
  qoulang: "pulang",
  jm: "jam",
  jma: "jam",
  pgi: "pagi",
  mlm: "malam",
  pulng: "pulang",
  brgkt: "berangkat",
  smpe: "sampai",
  sampe: "sampai",
  tlp: "telepon",
  telp: "telepon",
  krm: "kirim",
  byr: "bayar",
  tgl: "tanggal",
  ntar: "nanti",
  nnti: "nanti",
  skrg: "sekarang",
  sblm: "sebelum",
  sblum: "sebelum",
  stlh: "setelah",
  yg: "yang",
  sm: "sama",
  ama: "sama",
  klo: "kalau",
  kalo: "kalau",
  krn: "karena",
  udh: "sudah",
  uda: "sudah",
  dah: "sudah",
  blm: "belum",
  blom: "belum",
  jgn: "jangan",
  inget: "ingat",
  ingetin: "ingatkan",
  tlg: "tolong",
  lg: "lagi",
  trus: "terus",
  bgt: "banget",
  dmn: "dimana",
  kmn: "kemana",
  knp: "kenapa",
  brp: "berapa",
  mnt: "menit",
  jmt: "jumat",
  sen: "senin",
  blg: "bilang",
};

const FUZZY_KEYWORDS = [
  "besok",
  "berangkat",
  "kembali",
  "pergi",
  "harus",
  "mesti",
  "perlu",
  "wajib",
  "ingatkan",
  "meeting",
  "rapat",
  "kirim",
  "bayar",
  "telepon",
  "followup",
  "jam",
  "pagi",
  "siang",
  "sore",
  "malam",
  "selesai",
  "what",
  "forget",
  "forgetting",
  "tomorrow",
  "today",
  "remind",
  "done",
  "sudah",
  "hapus",
  "abaikan",
  "sebelum",
  "setelah",
  "tanggal",
  "nanti",
  "sekarang",
  "belum",
  "sama",
  "jangan",
  "ingat",
  "kabar",
  "vendor",
  "invoice",
  "deadline",
  "appointment",
] as const;

function editDistance(a: string, b: string) {
  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = prev[j]!;
      prev[j] = Math.min(
        prev[j]! + 1,
        prev[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = old;
    }
  }
  return prev[b.length]!;
}

function preserveCase(original: string, replacement: string) {
  if (/^[A-Z]/.test(original)) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function normalizeWord(word: string) {
  const lower = word.toLowerCase();
  const expanded = EXPANSIONS[lower];
  if (expanded) return preserveCase(word, expanded);

  if (lower.length < 5 || !/^[a-z]+$/.test(lower)) return word;

  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const keyword of FUZZY_KEYWORDS) {
    // Keep fuzzy correction conservative: typos normally preserve the first letter
    // and differ by at most two characters. Explicit weird spellings belong in EXPANSIONS.
    if (lower[0] !== keyword[0] || Math.abs(lower.length - keyword.length) > 2) continue;
    const distance = editDistance(lower, keyword);
    const threshold = lower.length >= 7 || keyword.length >= 7 ? 2 : 1;
    if (distance <= threshold && distance < bestDistance) {
      best = keyword;
      bestDistance = distance;
    }
  }
  return best ? preserveCase(word, best) : word;
}

/**
 * Normalize common Indonesian chat shorthand and obvious near-miss typos.
 * Keep proper nouns and unknown words untouched.
 */
export function normalizeCasualIndonesian(text: string) {
  return text
    .replace(/\bfollow\s*[- ]?\s*up\b/gi, "followup")
    .replace(/\bjgn\s+lupa\b/gi, "jangan lupa")
    .replace(/\bremind\s+me\b/gi, "ingatkan saya")
    .replace(/[A-Za-z]+/g, (word) => normalizeWord(word))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Produce a concise human-readable task title while preserving the raw quote elsewhere.
 */
export function normalizeActionTitle(text: string) {
  let value = normalizeCasualIndonesian(text).trim();

  // Remove conversational ownership / timing / obligation prefixes repeatedly.
  const prefixes = [
    /^(saya|aku|gue|gw)\s+/i,
    /^(hari\s+ini|besok|lusa)\s+/i,
    /^(harus|perlu|mesti|wajib|need\s+to|have\s+to|must)\s+/i,
    /^(jangan\s+lupa|tolong\s+ingatkan(?:\s+saya)?|ingatkan\s+saya)\s+/i,
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      const next = value.replace(prefix, "");
      if (next !== value) {
        value = next.trim();
        changed = true;
      }
    }
  }

  value = value
    .replace(
      /\s+(?:pada\s+)?(?:jam|pukul)\s+\d{1,2}(?:[.:]\d{2})?(?:\s*(?:pagi|siang|sore|malam|am|pm))?\s*$/i,
      "",
    )
    .replace(
      /\s+(?:pada\s+)?tanggal\s+\d{1,2}(?:\s+[A-Za-z]+(?:\s+\d{4})?)?\s*$/i,
      "",
    )
    .replace(/\s+(?:hari\s+ini|besok|lusa)\s*$/i, "")
    .replace(/[.!?,;:]+\s*$/, "")
    .trim();

  if (!value) return normalizeCasualIndonesian(text).trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizedIntentText(text: string) {
  return normalizeCasualIndonesian(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


export type ExplicitLanguageTeaching = {
  memoryType: "phrase_alias" | "entity_alias" | "reminder_preference";
  entityType?: "person" | "project" | "location";
  pattern: string;
  meaning: string;
  offsetMinutes?: number;
};

function inferTaughtEntityType(pattern: string) {
  const normalized = pattern.trim().toLowerCase();
  if (/^(pak|bapak|bu|ibu|mas|mbak)\b/.test(normalized)) return "person" as const;
  if (/^(project|proyek)\b/.test(normalized)) return "project" as const;
  if (/^(lokasi|tempat)\b/.test(normalized)) return "location" as const;
  return undefined;
}

export function detectExplicitLanguageTeaching(text: string): ExplicitLanguageTeaching | null {
  const casual = normalizeCasualIndonesian(text).trim();

  const alias =
    /^(?:kalau|jika)\s+(?:(?:saya|aku|gue|gw)\s+)?(?:bilang|nulis|ketik)\s+["“']?(.+?)["”']?\s+(?:itu\s+)?(?:maksudnya|artinya)\s+["“']?(.+?)["”']?$/i.exec(casual) ||
    /^["“']?(.+?)["”']?\s+(?:artinya|maksudnya)\s+["“']?(.+?)["”']?$/i.exec(casual);

  if (alias) {
    const pattern = alias[1]!.trim();
    const meaning = alias[2]!.trim();
    const entityType = inferTaughtEntityType(pattern);
    return {
      memoryType: entityType ? "entity_alias" : "phrase_alias",
      ...(entityType ? { entityType } : {}),
      pattern,
      meaning,
    };
  }

  const directEntity =
    /^((?:pak|bapak|bu|ibu|mas|mbak)\s+.+?|(?:project|proyek)\s+.+?|(?:lokasi|tempat)\s+.+?)\s+(maksudnya|artinya|alias(?:nya)?|itu|adalah|=)\s+(.+)$/i.exec(
      casual,
    );
  if (directEntity) {
    const pattern = directEntity[1]!.trim();
    const connector = directEntity[2]!.toLowerCase();
    const meaning = directEntity[3]!.trim();
    const entityType = inferTaughtEntityType(pattern);
    const ambiguousPredicate =
      /^(belum|sudah|udah|lagi|sedang|harus|mau|akan|bisa|tidak|nggak|ga|gak|baru|perlu|punya|kirim|balas|bales|datang|pergi|pindah|pindahkan|berubah|ganti)\b/i.test(
        meaning,
      );
    const looksLikeCompactCanonical = meaning.split(/\s+/).length <= 6;
    const explicitConnector =
      connector === "maksudnya" ||
      connector === "artinya" ||
      connector.startsWith("alias") ||
      connector === "=";

    if (
      entityType &&
      (explicitConnector || (looksLikeCompactCanonical && !ambiguousPredicate))
    ) {
      return {
        memoryType: "entity_alias",
        entityType,
        pattern,
        meaning,
      };
    }
  }

  const reminder =
    /^(?:kalau|jika)\s+(.+?)\s+(?:ingatkan(?:\s+saya)?|remind(?:\s+me)?)\s+(\d+)\s*(menit|jam|minute|minutes|hour|hours)\s*(?:sebelum|before)\b/i.exec(
      casual,
    );
  if (!reminder) return null;

  const amount = Number(reminder[2]);
  const unit = reminder[3]!.toLowerCase();
  const offsetMinutes = unit.startsWith("jam") || unit.startsWith("hour") ? amount * 60 : amount;
  return {
    memoryType: "reminder_preference",
    pattern: reminder[1]!.trim(),
    meaning: `${offsetMinutes} minutes before`,
    offsetMinutes,
  };
}
