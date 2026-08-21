const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const TEXT_MODEL = "gemini-2.5-flash";
const VISION_MODEL = "gemini-2.5-flash";

type Content = string | Array<Record<string, unknown>>;

async function chat(
  messages: { role: string; content: Content }[],
  opts: { json?: boolean; model?: string } = {},
) {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("AI belum dikonfigurasi.");
  const model = opts.model ?? TEXT_MODEL;

  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: typeof m.content === "string"
        ? [{ text: m.content }]
        : Array.isArray(m.content)
          ? m.content.map((part) => {
              if (part.type === "image_url") {
                const url = (part.image_url as { url?: string })?.url ?? "";
                // Extract base64 data from data URL
                const match = url.match(/^data:image\/\w+;base64,(.+)$/);
                return {
                  inlineData: {
                    mimeType: url.match(/^data:(image\/\w+)/)?.[1] ?? "image/png",
                    data: match?.[1] ?? "",
                  },
                };
              }
              return { text: (part as { text?: string }).text ?? "" };
            })
          : [{ text: String(m.content) }],
    }));

  // Extract system instruction if present
  const systemMsg = messages.find((m) => m.role === "system");
  const systemInstruction = systemMsg
    ? { parts: [{ text: typeof systemMsg.content === "string" ? systemMsg.content : "" }] }
    : undefined;

  const requestBody: Record<string, unknown> = {
    contents,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(
    `${GEMINI_API_URL}/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestBody),
    },
  );

  if (res.status === 429) throw new Error("Terlalu banyak permintaan. Coba lagi sebentar lagi.");
  if (res.status === 402) throw new Error("Kredit AI habis. Tambahkan kredit di workspace Anda.");
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Gemini API error", res.status, detail.slice(0, 400));
    throw new Error(`AI sedang bermasalah (${res.status}). Coba lagi.`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text;
}

/** Models sometimes wrap JSON in prose or code fences. */
function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
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
{"summary":"kalimat ringkas Bahasa Indonesia","context":["poin informasi non-actionable"],"projects":["nama proyek/klien"],"items":[{"title":"","kind":"commitment|task|deadline|waiting|followup","priority":"high|medium|low","dueOffsetDays":0,"person":"nama atau null","org":"nama perusahaan atau null","project":"nama proyek atau null","source":"nama grup/chat atau null","quote":"kutipan asli persis dari percakapan","aiNote":"kenapa NANTI mendeteksi ini, 1-2 kalimat Bahasa Indonesia","confidence":0.0}]}
dueOffsetDays: 0 = hari ini, 1 = besok, dst. null jika tidak ada tenggat. Untuk "waiting" selalu null.`;

export interface ExtractedItem {
  title: string;
  kind: "task" | "commitment" | "deadline" | "waiting" | "followup";
  priority: "high" | "medium" | "low";
  dueOffsetDays: number | null;
  person: string | null;
  org: string | null;
  project: string | null;
  source: string | null;
  quote: string;
  aiNote: string;
  confidence: number;
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
    context: Array.isArray(parsed?.context) ? parsed.context.filter((c) => typeof c === "string") : [],
    projects: Array.isArray(parsed?.projects) ? parsed.projects.filter((p) => typeof p === "string") : [],
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
      }))
      // Only keep confident detections; commitments need a higher bar.
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
export async function extractFromImage(dataUrl: string, sourceHint?: string): Promise<ExtractResult> {
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
