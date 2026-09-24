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
16. Jika user menanyakan free/busy, jadwal, lokasi meeting, atau apa yang ada besok dan Calendar memory tersedia, mode=answer. Calendar event adalah fakta jadwal, jangan diubah menjadi task baru.
17. Jika ada Waiting aktif yang jelas cocok dengan update seperti "belum bales", "belum kirim", atau "masih nunggu", jangan membuat waiting/task duplikat. Jawab statusnya atau sarankan follow-up.
18. Jika recent chat menunjukkan NANTI baru meminta satu detail untuk item tertentu, jawaban pendek berikutnya seperti "jam 10", "Jumat", "Budi", atau "iya" harus diterapkan ke item itu; jangan dianggap task baru.
19. Referensi berbasis role seperti "orang procurement itu" boleh di-resolve hanya jika ENTITY MEMORY punya tepat satu kandidat kuat. Jika ada dua kandidat yang sama-sama cocok, mode=clarify.
16. Google Calendar adalah fakta jadwal, BUKAN task. Pertanyaan seperti "besok ada apa?" atau "meeting dimana?" harus mode=answer dari calendar context; jangan membuat task duplikat dari event yang sudah ada.
17. People memory adalah identitas. Jika alias/role/company hanya cocok ke satu orang, gunakan orang kanonis itu. Jika ada dua kandidat sama kuat, mode=clarify — jangan menebak.
18. Bila user membuat aksi baru terhadap orang yang sudah dikenal (mis. "follow up Pak B besok"), mode=create tetap boleh, tetapi person harus merujuk identitas kanonis dari memory bila jelas.
19. Jika recent chat menunjukkan NANTI baru saja menanyakan SATU klarifikasi untuk sebuah item, jawaban pendek berikutnya seperti "jam 10 pagi", "Budi", "Jumat", atau "iya" harus diperlakukan sebagai jawaban atas klarifikasi itu — bukan task baru.

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