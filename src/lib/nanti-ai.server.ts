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
Tugasmu: membaca percakapan yang sering informal, disingkat, dan typo, lalu memahami MAKSUDNYA sebelum mengekstrak hal yang benar-benar perlu diingat.

PENTING TENTANG TYPO / CHAT LANGUAGE:
- Pengguna sering menulis cepat: "beosok"=besok, "bsk"=besok, "dr"=dari, "sy"=saya, "jma"=jam, "oulang" atau "pulng"=pulang, dll.
- Koreksi typo yang jelas secara diam-diam jika konteks membuat maksudnya kuat.
- JANGAN meminta klarifikasi hanya karena typo/ejaan bila maksudnya sudah jelas.
- quote HARUS tetap teks asli persis. normalizedText dan title harus memakai makna/ejaan yang sudah dinormalisasi.
- Jangan mengarang detail yang tidak tersirat atau tidak dinyatakan.

Untuk SETIAP item, pikirkan frame:
1. WHAT: tindakan/komitmen apa?
2. WHO: siapa pelakunya / siapa pihak terkait? Untuk tindakan pengguna sendiri gunakan "user".
3. WHEN: kapan, termasuk tanggal dan jam.
4. WHERE: lokasi/tempat bila disebut atau sangat jelas.
5. HOW: cara/channel/metode bila disebut (mis. telepon, WhatsApp, naik mobil). Jika tidak ada, null.
6. REMINDER: apakah perlu diingatkan, kapan paling berguna, dan kenapa.

Klasifikasi:
- "commitment": janji yang dibuat pengguna/seseorang ("Besok saya kirim revisi quotation")
- "task": tindakan yang harus dilakukan pengguna ("Tolong cek stok besok")
- "deadline": tenggat eksplisit ("Harus selesai Jumat")
- "waiting": pengguna menunggu pihak lain ("Saya masih tunggu approval owner")
- "followup": perlu ditindaklanjuti nanti tanpa tenggat jelas ("Nanti kabarin lagi ya")
- "information": konteks biasa; JANGAN masukkan ke items

ATURAN REMINDER:
- Jika ada tanggal/jam eksplisit dan item actionable, reminderRequired biasanya true.
- Jika pengguna memberi offset eksplisit ("2 jam sebelum"), gunakan itu.
- Jika tidak ada offset:
  * perjalanan / berangkat / pulang / meeting / appointment dengan jam: rekomendasikan 60 menit sebelum.
  * aksi singkat seperti kirim/call/bayar dengan jam: rekomendasikan 15 menit sebelum.
  * deadline tanpa jam: rekomendasikan pagi hari H (strategy="morning_of", offsetMinutes=0).
  * waiting: strategy="follow_up"; bukan reminder task biasa.
- reminder.message harus singkat, actionable, dan menyebut konteks penting (lokasi/orang bila ada).
- reminder.reason menjelaskan singkat kenapa timing itu berguna.

ATURAN KUALITAS:
- title harus singkat, natural, sudah dikoreksi, dan actionable. Jangan gunakan seluruh kalimat mentah bila bisa diringkas.
- confidence 0..1 harus jujur.
- commitment hanya jika confidence >= 0.8.
- item confidence < 0.5 jangan dikeluarkan.
- Deteksi proyek/klien jika jelas.
- needsClarification hanya jika detail yang benar-benar diperlukan untuk bertindak tidak bisa diinferensikan.
- task/deadline yang jelas menyebut "besok/Jumat/jam..." tidak perlu klarifikasi tanggal.
- clarifyingQuestion maksimal 12 kata dan hanya SATU pertanyaan terpenting.

Balas HANYA JSON valid:
{
  "summary":"ringkasan singkat",
  "context":["info non-actionable"],
  "projects":["nama proyek"],
  "items":[{
    "title":"judul normalized",
    "normalizedText":"kalimat maksud pengguna yang sudah diperbaiki",
    "what":"aksi inti",
    "who":"user atau nama pihak",
    "when":"teks waktu normalized atau null",
    "whenParsed":"YYYY-MM-DD atau null",
    "dueOffsetDays":0,
    "dueTime":"HH:mm atau null",
    "where":"lokasi atau null",
    "how":"cara/metode atau null",
    "person":"nama pihak terkait selain user atau null",
    "org":"organisasi atau null",
    "project":"proyek atau null",
    "kind":"commitment|task|deadline|waiting|followup",
    "priority":"high|medium|low",
    "source":"nama chat/grup atau null",
    "quote":"teks asli persis",
    "aiNote":"alasan deteksi singkat",
    "confidence":0.0,
    "reminderRequired":true,
    "reminder":{
      "shouldRemind":true,
      "strategy":"before|at_time|morning_of|follow_up|none",
      "offsetMinutes":60,
      "reason":"alasan singkat",
      "message":"teks pengingat singkat"
    },
    "needsClarification":false,
    "missingFields":[],
    "clarifyingQuestion":null
  }]
}
dueOffsetDays: 0=hari ini, 1=besok, dst; null jika tidak ada tenggat. Untuk waiting selalu null.
`

export interface ExtractedReminderPlan {
  shouldRemind: boolean;
  strategy?: "before" | "at_time" | "morning_of" | "follow_up" | "none";
  offsetMinutes?: number | null;
  reason?: string | null;
  message?: string | null;
}

export interface ExtractedItem {
  title: string;
  normalizedText?: string;
  what?: string;
  action?: string;
  who?: string | null;
  due?: string | null;
  kind: "task" | "commitment" | "deadline" | "waiting" | "followup";
  priority: "high" | "medium" | "low";
  dueOffsetDays: number | null;
  when?: string | null;
  whenParsed?: string | null;
  dueTime?: string | null;
  where?: string | null;
  how?: string | null;
  person: string | null;
  org: string | null;
  project: string | null;
  source: string | null;
  quote: string;
  aiNote: string;
  confidence: number;
  reminderRequired?: boolean;
  reminder?: ExtractedReminderPlan;
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
        normalizedText:
          typeof i.normalizedText === "string" ? i.normalizedText.slice(0, 2000) : undefined,
        what: typeof i.what === "string" ? i.what.slice(0, 500) : undefined,
        who: typeof i.who === "string" ? i.who.slice(0, 200) : null,
        dueTime: typeof i.dueTime === "string" ? i.dueTime : null,
        where: typeof i.where === "string" ? i.where.slice(0, 300) : null,
        how: typeof i.how === "string" ? i.how.slice(0, 300) : null,
        reminderRequired: Boolean(i.reminderRequired || i.reminder?.shouldRemind),
        reminder:
          i.reminder && typeof i.reminder === "object"
            ? {
                shouldRemind: Boolean(i.reminder.shouldRemind),
                strategy:
                  i.reminder.strategy === "before" ||
                  i.reminder.strategy === "at_time" ||
                  i.reminder.strategy === "morning_of" ||
                  i.reminder.strategy === "follow_up" ||
                  i.reminder.strategy === "none"
                    ? i.reminder.strategy
                    : undefined,
                offsetMinutes:
                  typeof i.reminder.offsetMinutes === "number"
                    ? Math.max(0, Math.min(30 * 24 * 60, i.reminder.offsetMinutes))
                    : null,
                reason:
                  typeof i.reminder.reason === "string" ? i.reminder.reason.slice(0, 500) : null,
                message:
                  typeof i.reminder.message === "string" ? i.reminder.message.slice(0, 500) : null,
              }
            : undefined,
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
Kamu punya memori kerja pengguna: tugas, janji, waiting, orang, proyek, dan semantic context WHAT/WHO/WHEN/WHERE/HOW/reminder.
Pengguna sering typo, singkatan, atau campur Indonesia-Inggris. Pahami maksud naturalnya; jangan terpaku pada ejaan.
Jawab singkat, tenang, dan konkret. Untuk pertanyaan seperti "what am I forgetting?", prioritaskan overdue, due today, waiting yang harus di-follow-up, dan klarifikasi yang belum selesai.
Sebutkan WHAT + WHEN dan WHO/WHERE bila relevan. Jika ada reminder plan, gunakan itu untuk menjelaskan kapan NANTI akan mengingatkan.
Maksimal 180 kata. Jangan mengarang data yang tidak ada dalam konteks.`;

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
  | "edit"
  | "mark_followed_up"
  | "mark_received";

export interface AssistantCommand {
  intent: AssistantCommandIntent;
  targetId: string | null;
  dueText: string | null;
  time: string | null;
  reminderOffsetMinutes: number | null;
  title: string | null;
  priority: "low" | "medium" | "high" | null;
  personName: string | null;
  projectName: string | null;
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
- edit: ganti judul, prioritas, orang, atau proyek pada item tersimpan
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
- Untuk edit, isi hanya field yang diminta: title, priority, personName, projectName.
- priority hanya low|medium|high. "urgent"/"penting banget" -> high.
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
    project?: string;
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
    "edit",
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
    title: typeof parsed?.title === "string" ? parsed.title.slice(0, 500) : null,
    priority:
      parsed?.priority === "low" || parsed?.priority === "medium" || parsed?.priority === "high"
        ? parsed.priority
        : null,
    personName:
      typeof parsed?.personName === "string" ? parsed.personName.slice(0, 200) : null,
    projectName:
      typeof parsed?.projectName === "string" ? parsed.projectName.slice(0, 200) : null,
    confidence:
      typeof parsed?.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0,
    question: typeof parsed?.question === "string" ? parsed.question : null,
    acknowledgement:
      typeof parsed?.acknowledgement === "string" ? parsed.acknowledgement : null,
  };
}
