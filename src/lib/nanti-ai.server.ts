const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const TEXT_MODEL = "gpt-4o-mini";
const VISION_MODEL = "gpt-4o-mini";

type Content = string | Array<Record<string, unknown>>;

async function chat(
  messages: { role: string; content: Content }[],
  opts: { json?: boolean; model?: string } = {},
) {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("AI belum dikonfigurasi.");
  const model = opts.model ?? TEXT_MODEL;

  const formattedMessages = messages.map((m) => {
    const role =
      m.role === "system" || m.role === "assistant" || m.role === "user" ? m.role : "user";
    if (typeof m.content === "string") {
      return { role, content: m.content };
    }
    const parts = m.content.map((part) => {
      if (part.type === "image_url") {
        return {
          type: "image_url",
          image_url: { url: (part.image_url as { url?: string })?.url ?? "" },
        };
      }
      return { type: "text", text: (part as { text?: string }).text ?? "" };
    });
    return { role, content: parts };
  });

  const requestBody: Record<string, unknown> = {
    model,
    messages: formattedMessages,
    temperature: 0.2,
    max_tokens: 8192,
    ...(opts.json
      ? { response_format: { type: "json_object" } }
      : {}),
  };

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (res.status === 429) throw new Error("Terlalu banyak permintaan. Coba lagi sebentar lagi.");
  if (res.status === 402) throw new Error("Kredit AI habis. Tambahkan kredit di OpenAI.");
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("OpenAI API error", res.status, detail.slice(0, 400));
    throw new Error(`AI sedang bermasalah (${res.status}). Coba lagi.`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Models sometimes wrap JSON in prose or code fences. */
function parseJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

const EXTRACT_SYSTEM = `Kamu adalah NANTI, asisten kerja AI untuk pengguna Indonesia yang bekerja lewat WhatsApp.
Tugasmu: membaca potongan percakapan WhatsApp dan mengekstrak HANYA hal yang benar-benar perlu diingat.

Klasifikasi setiap pesan penting ke salah satu tipe:
- "commitment": janji yang dibuat seseorang ("Besok saya kirim revisi quotation")
- "task": permintaan pekerjaan kepada pengguna ("Tolong cek stok besok")
- "deadline": tenggat eksplisit ("Harus selesai Jumat")
- "waiting": pengguna menunggu pihak lain ("Saya masih tunggu approval owner")
- "followup": perlu ditindaklanjuti nanti tanpa tenggat jelas ("Nanti kabarin lagi ya")
- "information": konteks, basa-basi, pengumuman, atau info biasa

ATURAN PENTING:
- JANGAN mengubah setiap kalimat menjadi tugas. Sebagian besar pesan adalah "information".
- Item bertipe "information" TIDAK boleh dimasukkan ke daftar items; ringkas saja di field "context".
- Buat "commitment" hanya bila keyakinan tinggi (confidence >= 0.8). Bila ragu, gunakan tipe lain atau abaikan.
- confidence adalah angka 0..1 yang jujur. Item dengan confidence < 0.5 jangan dikeluarkan.
- Deteksi juga proyek/klien yang dibahas (mis. "ABC Export") bila jelas disebut.

Balas HANYA JSON valid dengan bentuk:
{"summary":"kalimat ringkas Bahasa Indonesia","context":["poin informasi non-actionable"],"projects":["nama proyek/klien"],"items":[{"title":"","kind":"commitment|task|deadline|waiting|followup","priority":"high|medium|low","dueOffsetDays":0,"when":"teks waktu asli atau null","dueTime":"HH:mm atau null","person":"nama atau null","org":"nama perusahaan atau null","project":"nama proyek atau null","source":"nama grup/chat atau null","quote":"kutipan asli persis dari percakapan","aiNote":"kenapa NANTI mendeteksi ini, 1-2 kalimat Bahasa Indonesia","confidence":0.0,"reminderRequired":true,"needsClarification":false,"missingFields":[],"clarifyingQuestion":"satu pertanyaan singkat atau null"}]}
dueOffsetDays: 0 = hari ini, 1 = besok, dst. null jika tidak ada tenggat. Untuk "waiting" selalu null.
Jika aksi jelas tetapi detail penting hilang, set needsClarification=true dan tanyakan SATU hal paling penting saja.
- waiting tanpa siapa yang ditunggu -> missingFields=["person"], tanyakan siapa.
- task/deadline yang jelas menyebut "besok/Jumat/jam..." jangan dianggap perlu klarifikasi tanggal.
- permintaan pengingat tanpa waktu yang cukup jelas -> boleh klarifikasi date/time.
- clarifyingQuestion harus natural, maksimal 12 kata.`;

export interface ExtractedItem {
  title: string;
  kind: "task" | "commitment" | "deadline" | "waiting" | "followup";
  priority: "high" | "medium" | "low";
  dueOffsetDays: number | null;
  when?: string | null;
  whenParsed?: string | null;
  dueTime?: string | null;
  person: string | null;
  org: string | null;
  project: string | null;
  source: string | null;
  quote: string;
  aiNote: string;
  confidence: number;
  reminderRequired?: boolean;
  needsClarification?: boolean;
  missingFields?: string[];
  clarifyingQuestion?: string | null;
}

export interface ExtractResult {
  summary: string;
  context: string[];
  projects: string[];
  items: ExtractedItem[];
}

const KINDS = ["task", "commitment", "deadline", "waiting", "followup"] as const;

function clean(parsed: Partial<ExtractResult> | null): ExtractResult {
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  return {
    summary: typeof parsed?.summary === "string" ? parsed.summary : "",
    context: Array.isArray(parsed?.context)
      ? parsed.context.filter((c) => typeof c === "string")
      : [],
    projects: Array.isArray(parsed?.projects)
      ? parsed.projects.filter((p) => typeof p === "string")
      : [],
    items: items
      .filter((i) => i && typeof i.title === "string" && i.title.trim())
      .map((i) => ({
        ...i,
        kind: (KINDS as readonly string[]).includes(i.kind) ? i.kind : "task",
        priority: ["high", "medium", "low"].includes(i.priority) ? i.priority : "medium",
        confidence: typeof i.confidence === "number" ? Math.min(1, Math.max(0, i.confidence)) : 0.7,
        quote: typeof i.quote === "string" ? i.quote : "",
        aiNote: typeof i.aiNote === "string" ? i.aiNote : "",
        person: i.person ?? null,
        org: i.org ?? null,
        project: i.project ?? null,
        source: i.source ?? null,
        dueOffsetDays: typeof i.dueOffsetDays === "number" ? i.dueOffsetDays : null,
        when: typeof i.when === "string" ? i.when : null,
        whenParsed: typeof i.whenParsed === "string" ? i.whenParsed : null,
        dueTime: typeof i.dueTime === "string" ? i.dueTime : null,
        reminderRequired: Boolean(i.reminderRequired),
        needsClarification: Boolean(i.needsClarification),
        missingFields: Array.isArray(i.missingFields)
          ? i.missingFields.filter((field) => typeof field === "string")
          : [],
        clarifyingQuestion:
          typeof i.clarifyingQuestion === "string" ? i.clarifyingQuestion : null,
      }))
      .filter((i) => i.confidence >= (i.kind === "commitment" ? 0.8 : 0.5)),
  };
}

const EMPTY: ExtractResult = {
  summary: "NANTI tidak dapat membaca percakapan ini.",
  context: [],
  projects: [],
  items: [],
};

export async function extractItems(text: string, sourceHint?: string): Promise<ExtractResult> {
  const raw = await chat(
    [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content: `Nama grup/chat (jika tahu): ${sourceHint || "tidak diketahui"}\n\nPercakapan:\n${text}`,
      },
    ],
    { json: true },
  );
  return clean(parseJson<ExtractResult>(raw)) ?? EMPTY;
}

/** Reads a WhatsApp screenshot, transcribes it, then extracts the same structure. */
export async function extractFromImage(
  dataUrl: string,
  sourceHint?: string,
): Promise<ExtractResult> {
  const raw = await chat(
    [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Ini screenshot percakapan WhatsApp. Baca semua teksnya (termasuk nama pengirim), lalu ekstrak sesuai instruksi. Nama grup/chat (jika tahu): ${sourceHint || "dari screenshot"}. Balas hanya JSON.`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    { model: VISION_MODEL },
  );
  const parsed = parseJson<ExtractResult>(raw);
  if (!parsed) return { ...EMPTY, summary: "NANTI tidak dapat membaca screenshot ini." };
  return clean(parsed);
}

const ASK_SYSTEM = `Kamu adalah NANTI, chief of staff AI berbahasa Indonesia.
Kamu punya memori kerja pengguna (daftar tugas, janji, item menunggu, orang, proyek).
Jawab singkat, tenang, dan konkret. Gunakan Bahasa Indonesia yang natural, bukan robotik.
Sebutkan nama orang dan tenggat bila relevan. Maksimal 180 kata. Gunakan daftar bernomor bila ada beberapa hal.
Jangan mengarang data yang tidak ada dalam konteks.`;

export async function askNanti(question: string, context: string) {
  const answer = await chat([
    { role: "system", content: ASK_SYSTEM },
    { role: "user", content: `Memori kerja saat ini:\n${context}\n\nPertanyaan: ${question}` },
  ]);
  return answer.trim() || "Maaf, saya belum bisa menjawab itu sekarang.";
}


export type AssistantCommandIntent =
  | "none"
  | "complete"
  | "dismiss"
  | "reschedule"
  | "set_reminder"
  | "mark_followed_up"
  | "mark_received";

export interface AssistantCommand {
  intent: AssistantCommandIntent;
  targetId: string | null;
  dueText: string | null;
  time: string | null;
  reminderOffsetMinutes: number | null;
  confidence: number;
  question: string | null;
  acknowledgement: string | null;
}

const COMMAND_SYSTEM = `Kamu adalah router tindakan NANTI.
Pengguna sedang berbicara dengan asisten tentang tugas yang SUDAH tersimpan.
Tentukan apakah pesan terbaru meminta perubahan pada salah satu item yang diberikan.

Intent yang boleh:
- complete: pengguna bilang sudah selesai/beres
- dismiss: pengguna bilang itu bukan tugas, hapus, abaikan
- reschedule: ubah hari/tanggal/jam
- set_reminder: minta diingatkan pada/berapa lama sebelum
- mark_followed_up: pengguna bilang sudah follow up item waiting
- mark_received: hal yang ditunggu sudah diterima
- none: bukan perintah edit terhadap item tersimpan

ATURAN:
- targetId HARUS salah satu ID yang diberikan. Jangan membuat ID.
- Bila target ambigu, targetId=null dan isi question dengan SATU pertanyaan singkat.
- "itu", "tadi", "yang barusan" biasanya merujuk item paling baru, tetapi confidence harus turun bila masih ambigu.
- dueText simpan frasa waktu pengguna apa adanya, misalnya "Jumat", "besok", "tanggal 25".
- time gunakan HH:mm bila eksplisit.
- reminderOffsetMinutes hanya bila pengguna bilang "2 jam sebelum", "30 menit sebelum", dst.
- acknowledgement adalah jawaban sangat singkat setelah tindakan berhasil.
Balas JSON valid saja.`;

export async function interpretAssistantCommand(
  message: string,
  itemContext: Array<{
    id: string;
    title: string;
    kind: string;
    status: string;
    due?: string;
    time?: string;
    person?: string;
    updatedAt?: string;
  }>,
): Promise<AssistantCommand> {
  const raw = await chat(
    [
      { role: "system", content: COMMAND_SYSTEM },
      {
        role: "user",
        content: `Item tersimpan (urutan terbaru dulu):\n${JSON.stringify(itemContext)}\n\nPesan terbaru: ${message}`,
      },
    ],
    { json: true },
  );
  const parsed = parseJson<Partial<AssistantCommand>>(raw);
  const allowed = new Set<AssistantCommandIntent>([
    "none",
    "complete",
    "dismiss",
    "reschedule",
    "set_reminder",
    "mark_followed_up",
    "mark_received",
  ]);
  const ids = new Set(itemContext.map((item) => item.id));
  const intent = parsed?.intent && allowed.has(parsed.intent) ? parsed.intent : "none";
  const targetId = typeof parsed?.targetId === "string" && ids.has(parsed.targetId)
    ? parsed.targetId
    : null;
  return {
    intent,
    targetId,
    dueText: typeof parsed?.dueText === "string" ? parsed.dueText : null,
    time: typeof parsed?.time === "string" ? parsed.time : null,
    reminderOffsetMinutes:
      typeof parsed?.reminderOffsetMinutes === "number"
        ? Math.max(0, Math.min(30 * 24 * 60, parsed.reminderOffsetMinutes))
        : null,
    confidence:
      typeof parsed?.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0,
    question: typeof parsed?.question === "string" ? parsed.question : null,
    acknowledgement:
      typeof parsed?.acknowledgement === "string" ? parsed.acknowledgement : null,
  };
}
