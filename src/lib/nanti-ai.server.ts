const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = process.env["GEMINI_MODEL"] || "gemini-3.5-flash";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_TEXT_MODEL = process.env["OPENAI_MODEL"] || "gpt-4o-mini";

type Content = string | Array<Record<string, unknown>>;

function geminiParts(content: Content) {
  if (typeof content === "string") return [{ text: content }];
  return content.map((part) => {
    if (part.type === "image_url") {
      const url = (part.image_url as { url?: string })?.url ?? "";
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      return {
        inlineData: {
          mimeType: match?.[1] || "image/png",
          data: match?.[2] || "",
        },
      };
    }
    return { text: String((part as { text?: string }).text ?? "") };
  });
}

async function chatGemini(
  messages: { role: string; content: Content }[],
  opts: { json?: boolean; model?: string } = {},
) {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const model = opts.model || GEMINI_MODEL;
  const system = messages.find((message) => message.role === "system");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: geminiParts(message.content),
    }));

  const body: Record<string, unknown> = {
    contents,
    ...(system
      ? {
          systemInstruction: {
            parts: [
              {
                text:
                  typeof system.content === "string"
                    ? system.content
                    : system.content
                        .map((part) => String((part as { text?: string }).text ?? ""))
                        .join("\n"),
              },
            ],
          },
        }
      : {}),
    generationConfig: {
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const response = await fetch(
    `${GEMINI_API_URL}/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`Gemini API error ${response.status}`);
    console.error("Gemini API error", response.status, detail.slice(0, 500));
    throw error;
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

async function chatOpenAI(
  messages: { role: string; content: Content }[],
  opts: { json?: boolean; model?: string } = {},
) {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");
  const model = opts.model || OPENAI_TEXT_MODEL;

  const formattedMessages = messages.map((message) => {
    const role =
      message.role === "system" ||
      message.role === "assistant" ||
      message.role === "user"
        ? message.role
        : "user";
    if (typeof message.content === "string") {
      return { role, content: message.content };
    }
    return {
      role,
      content: message.content.map((part) => {
        if (part.type === "image_url") {
          return {
            type: "image_url",
            image_url: { url: (part.image_url as { url?: string })?.url ?? "" },
          };
        }
        return {
          type: "text",
          text: String((part as { text?: string }).text ?? ""),
        };
      }),
    };
  });

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.2,
      max_tokens: 8192,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("OpenAI API error", response.status, detail.slice(0, 500));
    throw new Error(`OpenAI API error ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function chat(
  messages: { role: string; content: Content }[],
  opts: { json?: boolean; model?: string } = {},
) {
  const hasGemini = Boolean(process.env["GEMINI_API_KEY"]);
  const hasOpenAI = Boolean(process.env["OPENAI_API_KEY"]);

  if (!hasGemini && !hasOpenAI) {
    throw new Error("AI belum dikonfigurasi.");
  }

  if (hasGemini) {
    try {
      return await chatGemini(messages, opts);
    } catch (error) {
      if (!hasOpenAI) {
        throw new Error("AI sedang bermasalah. Coba lagi sebentar lagi.");
      }
      console.error("Gemini failed; falling back to OpenAI:", error);
    }
  }

  try {
    return await chatOpenAI(messages, opts);
  } catch {
    throw new Error("AI sedang bermasalah. Coba lagi sebentar lagi.");
  }
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

const LANGUAGE_GUIDE = `
CARA MEMAHAMI CHAT PENGGUNA:
- Prioritaskan maksud, bukan ejaan. Bahasa bisa Indonesia, English, atau campuran.
- Singkatan umum: gw/gue/aku/sy=saya; bsk=besok; dr=dari; tgl=tanggal; yg=yang; udh=sudah; blm=belum; ntar=nanti; sblm=sebelum; jgn=jangan; krm=kirim; tlp/telp=telepon; mnt=menit.
- Tidak ada tanda baca bukan berarti tidak ada struktur. Cari aksi, pihak, waktu, tempat, cara, dan hubungan antar klausa.
- Kata ganti seperti "itu", "yang tadi", "dia", "mereka", "yg invoice", "yg puncak" harus dihubungkan ke konteks bila referensinya cukup jelas.
- Jangan mengoreksi nama orang, brand, proyek, atau tempat hanya karena terlihat tidak umum.
- Untuk jam tanpa pagi/siang/sore/malam, jangan mengarang AM/PM bila benar-benar ambigu.
- Jangan menganggap percakapan santai sebagai tugas kecuali ada tindakan, komitmen, deadline, waiting, follow-up, atau permintaan reminder yang nyata.
- Bila ENTITY & ROUTINE MEMORY berisi satu kandidat orang/proyek yang jelas cocok dengan alias, role, company, atau recent activity, gunakan NAMA KANONIS kandidat itu pada field person/project.
- Contoh: bila memory bilang "Budi · role=procurement · aliases=Pak B, Budi vendor", maka "orang procurement itu" atau "Pak B" boleh di-resolve ke Budi hanya bila tidak ada kandidat lain yang sama kuat.
- Jika dua orang/proyek sama-sama masuk akal, JANGAN memilih sendiri: set needsClarification=true dan tanya satu pertanyaan.
- Routine memory adalah bukti kebiasaan, BUKAN fakta bahwa tugas baru pasti ada. Jangan membuat task hanya karena sebuah routine tersimpan.
- Isi detail rutin yang tidak disebut (mis. jam/tempat biasa) hanya jika pesan sekarang jelas merujuk kebiasaan itu, mis. "seperti biasa", "yang biasanya", "same as usual", atau konteks percakapan membuat referensinya tunggal dan kuat.
- Pesan eksplisit saat ini selalu mengalahkan alias/routine memory lama.

CONTOH PEMAHAMAN:
1) "Saya beosok harus oulang dr puncak jam 10 pagi"
   -> what: "Pulang dari Puncak"; who: user; when: besok 10:00; where: Puncak; reminder: 60 menit sebelum.
2) "gw bsk meeting sm bu rina jam 2 siang di scbd"
   -> task "Meeting dengan Bu Rina"; person: Bu Rina; when: besok 14:00; where: SCBD.
3) "jgn lupa krm invoice ke pak dodi tgl 25"
   -> task "Kirim invoice ke Pak Dodi"; person: Pak Dodi; tanggal 25; reminder pagi hari H bila tidak ada jam.
4) "blm ada kabar dr vendor, follow up kamis"
   -> followup/waiting yang actionable untuk Kamis, bukan information biasa.
5) "mbak lia bilang revisinya dikirim jumat"
   -> commitment dari Mbak Lia; user perlu mengingat janji itu, bukan mengubah aktor menjadi user.
6) "remind gue 30 mnt sblm meeting"
   -> reminder 30 menit sebelum meeting yang dirujuk konteks; jangan buat tugas baru bila meeting sudah ada.
7) "yang tadi pindahin ke jumat jam 3 sore"
   -> edit/reschedule item yang dirujuk, bukan task baru.
8) "gw udh bayar yg invoice tadi"
   -> complete item invoice yang dirujuk.
9) "besok jam 10 aja"
   -> jika konteks sebelumnya sedang membahas jadwal satu item yang jelas, ini perubahan WHEN; jika tidak jelas, tanya satu pertanyaan.
10) "Pak Rio belum bales"
   -> bila ada item waiting aktif untuk Pak Rio, ini konteks waiting; jangan otomatis menciptakan task duplikat.
`;

const EXTRACT_SYSTEM = `${LANGUAGE_GUIDE}\nKamu adalah NANTI, asisten kerja AI untuk pengguna Indonesia yang bekerja lewat WhatsApp.
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
`;

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

export async function extractItems(
  text: string,
  sourceHint?: string,
  contextHint?: string,
): Promise<ExtractResult> {
  const raw = await chat(
    [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content: `Nama grup/chat (jika tahu): ${sourceHint || "tidak diketahui"}
${contextHint ? `\nKonteks percakapan dan memori terbaru (gunakan hanya untuk resolusi referensi, jangan buat task dari konteks lama):\n${contextHint.slice(0, 12000)}\n` : ""}
Pesan/percakapan baru yang harus dianalisis:
${text}`,
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
  contextHint?: string,
): Promise<ExtractResult> {
  const raw = await chat(
    [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Ini screenshot percakapan WhatsApp. Baca semua teksnya (termasuk nama pengirim), lalu ekstrak sesuai instruksi. Nama grup/chat (jika tahu): ${sourceHint || "dari screenshot"}.
${contextHint ? `\nKonteks/personal learning user (gunakan untuk interpretasi saja, jangan buat task lama):\n${contextHint.slice(0, 10000)}\n` : ""}
Balas hanya JSON.`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    {},
  );
  const parsed = parseJson<ExtractResult>(raw);
  if (!parsed) return { ...EMPTY, summary: "NANTI tidak dapat membaca screenshot ini." };
  return clean(parsed);
}

const ASK_SYSTEM = `${LANGUAGE_GUIDE}
Kamu adalah NANTI, chief of staff AI berbahasa Indonesia.
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
  | "mark_received"
  | "teach_language";

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
  learningType:
    | "phrase_alias"
    | "entity_alias"
    | "reminder_preference"
    | "style_preference"
    | null;
  learningEntityType: "person" | "project" | "location" | null;
  learningPattern: string | null;
  learningMeaning: string | null;
  confidence: number;
  question: string | null;
  acknowledgement: string | null;
}

const COMMAND_SYSTEM = `${LANGUAGE_GUIDE}
Kamu adalah router tindakan NANTI.
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
- teach_language: pengguna secara eksplisit mengajari NANTI arti istilah, alias, kebiasaan reminder, atau preferensi gaya
- none: bukan perintah edit terhadap item tersimpan

ATURAN:
- Pengguna sering typo/singkatan/campur bahasa. Pahami maksud yang jelas dan jangan gagal hanya karena ejaan.
- targetId HARUS salah satu ID yang diberikan. Jangan membuat ID.
- Bila target ambigu, targetId=null dan isi question dengan SATU pertanyaan singkat.
- "itu", "tadi", "yang barusan" biasanya merujuk item paling baru, tetapi confidence harus turun bila masih ambigu.
- dueText simpan frasa waktu pengguna apa adanya, misalnya "Jumat", "besok", "tanggal 25".
- time gunakan HH:mm bila eksplisit.
- reminderOffsetMinutes hanya bila pengguna bilang "2 jam sebelum", "30 menit sebelum", dst.
- Untuk edit, isi hanya field yang diminta: title, priority, personName, projectName.
- Untuk teach_language, targetId HARUS null. Isi:
  * learningType="phrase_alias" untuk "kalau aku bilang X maksudnya Y"
  * learningType="entity_alias" untuk alias orang/proyek/lokasi, mis. "Pak B itu Budi"; isi learningEntityType="person|project|location"
  * learningType="reminder_preference" untuk kebiasaan reminder, mis. "kalau meeting ingetin 30 menit sebelum"
  * learningType="style_preference" untuk gaya respons, mis. "jawab singkat aja"
  * learningPattern = kata/frasa/konteks pemicu
  * learningMeaning = arti/preferensi yang harus diingat
- Jangan gunakan teach_language untuk koreksi satu kali seperti "yang tadi pindahin ke Jumat"; itu tetap reschedule/edit.
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
  recentConversation?: string,
): Promise<AssistantCommand> {
  const raw = await chat(
    [
      { role: "system", content: COMMAND_SYSTEM },
      {
        role: "user",
        content: `Item tersimpan (urutan terbaru dulu):
${JSON.stringify(itemContext)}
${recentConversation ? `\nPercakapan terbaru:\n${recentConversation.slice(0, 6000)}\n` : ""}
Pesan terbaru yang harus diinterpretasikan:
${message}`,
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
    "teach_language",
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
    learningType:
      parsed?.learningType === "phrase_alias" ||
      parsed?.learningType === "entity_alias" ||
      parsed?.learningType === "reminder_preference" ||
      parsed?.learningType === "style_preference"
        ? parsed.learningType
        : null,
    learningEntityType:
      parsed?.learningEntityType === "person" ||
      parsed?.learningEntityType === "project" ||
      parsed?.learningEntityType === "location"
        ? parsed.learningEntityType
        : null,
    learningPattern:
      typeof parsed?.learningPattern === "string" ? parsed.learningPattern.slice(0, 500) : null,
    learningMeaning:
      typeof parsed?.learningMeaning === "string" ? parsed.learningMeaning.slice(0, 1000) : null,
    confidence:
      typeof parsed?.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0,
    question: typeof parsed?.question === "string" ? parsed.question : null,
    acknowledgement:
      typeof parsed?.acknowledgement === "string" ? parsed.acknowledgement : null,
  };
}


export type AssistantTurnMode =
  | "answer"
  | "create"
  | "complete"
  | "dismiss"
  | "reschedule"
  | "set_reminder"
  | "edit"
  | "mark_followed_up"
  | "mark_received"
  | "teach_language"
  | "clarify";

export interface AssistantTurnResult {
  mode: AssistantTurnMode;
  reply: string;
  confidence: number;
  targetId: string | null;
  dueText: string | null;
  time: string | null;
  reminderOffsetMinutes: number | null;
  title: string | null;
  priority: "low" | "medium" | "high" | null;
  personName: string | null;
  projectName: string | null;
  learningType:
    | "phrase_alias"
    | "entity_alias"
    | "reminder_preference"
    | "style_preference"
    | null;
  learningEntityType: "person" | "project" | "location" | null;
  learningPattern: string | null;
  learningMeaning: string | null;
  items: ExtractedItem[];
}

const TURN_SYSTEM = `${LANGUAGE_GUIDE}
Kamu adalah NANTI — asisten kerja pribadi yang bertindak seperti chief of staff, bukan chatbot umum.

SATU PESAN = SATU KEPUTUSAN UTAMA.
Pilih tepat SATU mode utama:
- answer: pengguna bertanya tentang memori kerja, tugas, jadwal, orang, proyek, apa yang terlupa, apa yang harus dilakukan, atau meminta rangkuman.
- create: pengguna menyatakan tugas/komitmen/deadline/waiting/follow-up BARU yang jelas perlu disimpan.
- complete: menandai item tersimpan selesai.
- dismiss: menghapus/mengabaikan item tersimpan.
- reschedule: mengubah tanggal/jam item tersimpan.
- set_reminder: mengatur pengingat item tersimpan.
- edit: mengubah judul/prioritas/orang/proyek item tersimpan.
- mark_followed_up: pengguna sudah follow up item waiting.
- mark_received: hal yang ditunggu sudah diterima.
- teach_language: pengguna secara eksplisit mengajari istilah/alias/preferensi.
- clarify: maksud penting tetapi tidak cukup aman untuk bertindak; tanya SATU pertanyaan pendek.

PRINSIP:
1. Pahami maksud, bukan ejaan. Typo, singkatan, tanpa tanda baca, campuran Indonesia/English adalah normal.
2. Input NORMALIZED hanya petunjuk. RAW MESSAGE adalah sumber kebenaran.
3. Jangan menjalankan tiga interpretasi sekaligus. Pilih satu mode yang paling sesuai.
4. Jangan membuat task dari pertanyaan. "What am I forgetting?", "apa hari ini?", "siapa yang harus difollow up?" adalah answer.
5. Jangan menjawab generik bila sebenarnya ada aksi yang jelas. "bsk sy harus pulang dr puncak jam 10" adalah create.
6. Jangan membuat task baru bila pengguna sedang mengedit item yang jelas dirujuk: "yang tadi Jumat aja" = reschedule.
7. Jangan membuat task duplikat bila pesan hanya memberi status tentang waiting yang sudah ada.
8. Bila create, items berisi HANYA item baru dari pesan saat ini. Jangan mengeluarkan item lama dari context.
9. Bila bukan create, items HARUS [].
10. Gunakan canonical person/project dari memory hanya jika satu kandidat jelas. Kalau ambigu, clarify.
11. reply harus natural, singkat, berguna, dan tidak robotik. Maksimal 120 kata.
12. Untuk create yang jelas, reply mengkonfirmasi WHAT + WHEN + WHO/WHERE bila relevan.
13. Untuk answer, jawab langsung dari workspace memory. Jangan mengarang.
14. Untuk typo yang jelas, perbaiki diam-diam. Jangan bertanya hanya karena typo.
15. Current message selalu mengalahkan learned memory lama.
16. Jika recent chat menunjukkan NANTI baru saja menanyakan SATU klarifikasi untuk sebuah item, jawaban pendek berikutnya seperti "jam 10 pagi", "Budi", "Jumat", atau "iya" harus diperlakukan sebagai jawaban atas klarifikasi itu — bukan task baru.

CONTOH:
RAW: "Saya beosok harus oulang dr puncak jam 10 pagi"
NORMALIZED: "saya besok harus pulang dari puncak jam 10 pagi"
=> mode=create; task Pulang dari Puncak; besok 10:00; where=Puncak.

RAW: "what am i forgetting?"
=> mode=answer; rangkum overdue, hari ini, waiting/follow-up, clarification.

RAW: "yang tadi jumat jam 3 aja"
=> mode=reschedule terhadap item terbaru yang jelas.

RAW: "udah beres yg invoice"
=> mode=complete item invoice yang cocok.

RAW: "Pak B belum bales"
=> bila ada waiting aktif yang jelas untuk Pak B, mode=answer dengan status/follow-up suggestion; jangan buat task duplikat.

RAW: "Pak B itu Budi"
=> mode=teach_language, learningType=entity_alias, learningEntityType=person.

FORMAT JSON:
{
  "mode":"answer|create|complete|dismiss|reschedule|set_reminder|edit|mark_followed_up|mark_received|teach_language|clarify",
  "reply":"jawaban singkat natural",
  "confidence":0.0,
  "targetId":null,
  "dueText":null,
  "time":null,
  "reminderOffsetMinutes":null,
  "title":null,
  "priority":null,
  "personName":null,
  "projectName":null,
  "learningType":null,
  "learningEntityType":null,
  "learningPattern":null,
  "learningMeaning":null,
  "items":[]
}

Jika mode=create, bentuk setiap items sama dengan schema extraction NANTI:
title, normalizedText, what, who, when, whenParsed, dueOffsetDays, dueTime, where, how,
person, org, project, kind, priority, source, quote, aiNote, confidence,
reminderRequired, reminder, needsClarification, missingFields, clarifyingQuestion.
`;

export async function runAssistantTurn(input: {
  rawMessage: string;
  normalizedMessage: string;
  workspaceContext: string;
  itemContext: Array<{
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
  recentConversation?: string;
}): Promise<AssistantTurnResult> {
  const raw = await chat(
    [
      { role: "system", content: TURN_SYSTEM },
      {
        role: "user",
        content: `TODAY (Asia/Jakarta): ${new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date())}

RAW MESSAGE:
${input.rawMessage}

NORMALIZED MESSAGE:
${input.normalizedMessage}

CURRENT SAVED ITEMS (newest/relevant first):
${JSON.stringify(input.itemContext).slice(0, 14000)}

WORKSPACE MEMORY:
${input.workspaceContext.slice(0, 18000)}

RECENT CHAT:
${(input.recentConversation || "").slice(0, 7000)}

Return one decision only.`,
      },
    ],
    { json: true },
  );

  const parsed = parseJson<Partial<AssistantTurnResult>>(raw);
  const allowed = new Set<AssistantTurnMode>([
    "answer",
    "create",
    "complete",
    "dismiss",
    "reschedule",
    "set_reminder",
    "edit",
    "mark_followed_up",
    "mark_received",
    "teach_language",
    "clarify",
  ]);
  const ids = new Set(input.itemContext.map((item) => item.id));
  const mode =
    parsed?.mode && allowed.has(parsed.mode as AssistantTurnMode)
      ? (parsed.mode as AssistantTurnMode)
      : "clarify";
  const targetId =
    typeof parsed?.targetId === "string" && ids.has(parsed.targetId)
      ? parsed.targetId
      : null;

  const created =
    mode === "create"
      ? clean({
          summary: "",
          context: [],
          projects: [],
          items: Array.isArray(parsed?.items) ? parsed.items : [],
        }).items
      : [];

  return {
    mode,
    reply:
      typeof parsed?.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim().slice(0, 2000)
        : mode === "clarify"
          ? "Maksudmu yang mana?"
          : "Siap.",
    confidence:
      typeof parsed?.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.7,
    targetId,
    dueText: typeof parsed?.dueText === "string" ? parsed.dueText : null,
    time: typeof parsed?.time === "string" ? parsed.time : null,
    reminderOffsetMinutes:
      typeof parsed?.reminderOffsetMinutes === "number"
        ? Math.max(0, Math.min(43200, parsed.reminderOffsetMinutes))
        : null,
    title: typeof parsed?.title === "string" ? parsed.title.slice(0, 500) : null,
    priority:
      parsed?.priority === "low" ||
      parsed?.priority === "medium" ||
      parsed?.priority === "high"
        ? parsed.priority
        : null,
    personName:
      typeof parsed?.personName === "string" ? parsed.personName.slice(0, 200) : null,
    projectName:
      typeof parsed?.projectName === "string" ? parsed.projectName.slice(0, 200) : null,
    learningType:
      parsed?.learningType === "phrase_alias" ||
      parsed?.learningType === "entity_alias" ||
      parsed?.learningType === "reminder_preference" ||
      parsed?.learningType === "style_preference"
        ? parsed.learningType
        : null,
    learningEntityType:
      parsed?.learningEntityType === "person" ||
      parsed?.learningEntityType === "project" ||
      parsed?.learningEntityType === "location"
        ? parsed.learningEntityType
        : null,
    learningPattern:
      typeof parsed?.learningPattern === "string"
        ? parsed.learningPattern.slice(0, 500)
        : null,
    learningMeaning:
      typeof parsed?.learningMeaning === "string"
        ? parsed.learningMeaning.slice(0, 1000)
        : null,
    items: created,
  };
}
