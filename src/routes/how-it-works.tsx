import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { StoryPage, type StoryCopy } from "@/components/nanti/story-page";
import type { Bilingual } from "@/lib/i18n";
import { canonical } from "@/lib/site";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    links: [canonical("/how-it-works")],
    meta: [
      { title: "Cara kerja NANTI · NANTI" },
      {
        name: "description",
        content:
          "Ketik seperti biasa, tempel percakapan, atau unggah screenshot. NANTI mengubah janji, tanggal, orang, dan follow-up menjadi sesuatu yang bisa Anda lacak.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const COPY: Bilingual<StoryCopy> = {
  id: {
    hero: {
      eyebrow: "Cara kerja",
      titleA: "Bilang ke NANTI apa maksud Anda.",
      titleB: "NANTI membantu Anda mengingatnya.",
      description:
        "Ketik seperti biasa, typo pun tidak apa-apa. Minta NANTI mengingat sesuatu, tempel percakapan, atau unggah screenshot. NANTI menemukan tindakan, tanggal, orang, dan follow-up, lalu menyimpan yang sudah jelas atau bertanya kalau ada hal penting yang kurang.",
      note: "Anda tidak perlu menulis perintah tugas yang sempurna. NANTI dibuat untuk bahasa sehari-hari: Indonesia, Inggris, campuran, singkatan, dan chat yang berantakan.",
    },
    moment: {
      eyebrow: "Satu percakapan",
      title: "Tanya, simpan, ubah, dan selesaikan pekerjaan di satu tempat.",
      body: "NANTI bukan formulir yang harus Anda rawat. Anda bisa bilang apa yang perlu terjadi, tanya apa yang terlupa, ubah waktunya nanti, atau tandai selesai dengan bahasa biasa.",
      chat: {
        label: "Bahasa berantakan tidak masalah",
        userText: "Saya beosok harus oulang dr puncak jam 10 pagi",
        assistantText: "Siap. Pulang dari Puncak besok jam 10.00.",
        saved: "Tersimpan di NANTI: Pulang dari Puncak",
        footer:
          "NANTI membetulkan typo yang jelas tanpa ribut. Kalau ada detail penting yang benar-benar ambigu, NANTI bertanya, bukan menebak.",
      },
    },
    proof: {
      eyebrow: "Alurnya",
      title: "Dari percakapan menjadi sesuatu yang bisa Anda andalkan.",
      items: [
        {
          title: "1. Bawa konteksnya",
          description:
            "Ketik langsung di Tanya NANTI, tempel percakapan, atau unggah screenshot. Menyalin chat WhatsApp ke NANTI sudah bisa hari ini; meneruskan langsung dari WhatsApp tidak wajib untuk aplikasi publik.",
        },
        {
          title: "2. NANTI memahaminya",
          description:
            "NANTI mencari apa yang perlu dikerjakan, siapa yang terlibat, tanggal dan jam, proyek, tempat, pengingat, dan hal yang sedang Anda tunggu.",
        },
        {
          title: "3. Yang jelas langsung disimpan",
          description:
            "Kalau maksudnya jelas, NANTI membuat tugas atau item Menunggu. Kalau ada detail kunci yang belum jelas, NANTI mengajukan satu pertanyaan singkat, bukan mengarang jawaban.",
        },
        {
          title: "4. Terus ngobrol untuk mengubahnya",
          description:
            "Bilang saja “yang tadi Jumat aja”, “udah beres yang invoice”, atau “ingatkan 30 menit sebelum”. NANTI bisa menjadwal ulang, menyelesaikan, mengedit, dan menambah pengingat lewat percakapan.",
        },
        {
          title: "5. Tanya NANTI apa yang perlu diperhatikan",
          description:
            "Tanya “Apa yang saya lupa?”, “Hari ini harus ngapain?”, “Siapa yang perlu saya follow up?”, atau “Apa yang sudah lewat tenggat?” dan NANTI menjawab dari workspace Anda.",
        },
      ],
    },
    boundary: {
      title: "Apa yang NANTI lakukan, dan apa yang tidak ia klaim.",
      items: [
        {
          label: "NANTI tidak mengubah setiap kalimat jadi tugas.",
          description:
            "Obrolan santai dan kabar terbaru tetap jadi obrolan. NANTI hanya menyimpan item baru kalau ada tindakan, janji, tenggat, hal yang ditunggu, atau niat pengingat yang nyata.",
        },
        {
          label: "NANTI tidak menebak kalau ada dua kemungkinan.",
          description:
            "Kalau “Budi” bisa berarti dua orang berbeda atau “rapatnya” bisa merujuk ke dua tugas, NANTI akan bertanya yang mana.",
        },
        {
          label: "NANTI belajar bahasa Anda seiring waktu.",
          description:
            "Anda bisa mengajarkan alias dan preferensi seperti “Pak B itu Budi” atau waktu pengingat favorit. Konteks yang dipelajari tetap terikat ke akun Anda.",
        },
        {
          label: "Alur publik saat ini berbasis web.",
          description:
            "Tanya NANTI, tempel percakapan, impor screenshot, tugas, Menunggu, dan pengingat di aplikasi adalah alur yang andal saat ini. Integrasi kalender, notifikasi push, dan WhatsApp langsung sedang dimatangkan sebelum kami menjanjikannya sebagai fitur utama.",
        },
      ],
    },
    cta: {
      title: "Coba NANTI dengan satu hal nyata yang perlu Anda ingat.",
      description:
        "Ketik seperti biasa. NANTI yang menyesuaikan diri dengan Anda, bukan sebaliknya.",
    },
  },
  en: {
    hero: {
      eyebrow: "How it works",
      titleA: "Tell NANTI what you mean.",
      titleB: "It helps you keep track of it.",
      description:
        "Type naturally, even with typos. Ask NANTI to remember something, paste a conversation, or upload a screenshot. NANTI finds likely actions, dates, people, and follow-ups, then saves what is clear or asks when something important is missing.",
      note: "You do not need to write perfect task commands. NANTI is designed for everyday Indonesian, English, mixed language, shorthand, and messy chat.",
    },
    moment: {
      eyebrow: "One conversation",
      title: "Ask, save, change, and finish work in the same place.",
      body: "NANTI is not a form you have to maintain. You can tell it what needs to happen, ask what you are forgetting, change the timing later, or mark something done in normal language.",
      chat: {
        label: "Messy language is okay",
        userText: "Saya beosok harus oulang dr puncak jam 10 pagi",
        assistantText: "Got it. Pulang dari Puncak tomorrow at 10:00.",
        saved: "Saved to NANTI: Pulang dari Puncak",
        footer:
          "NANTI normalizes obvious typos quietly. If a key detail is genuinely ambiguous, it asks instead of guessing.",
      },
    },
    proof: {
      eyebrow: "The flow",
      title: "From a conversation to something you can rely on.",
      items: [
        {
          title: "1. Bring the context",
          description:
            "Type directly into Ask NANTI, paste a conversation, or upload a screenshot. Copying a WhatsApp chat into NANTI works today; direct WhatsApp forwarding is not required for the public app.",
        },
        {
          title: "2. NANTI interprets it",
          description:
            "It looks for what needs doing, who is involved, dates and times, projects, places, reminders, and things you are waiting to receive.",
        },
        {
          title: "3. Clear things get saved",
          description:
            "When the intent is clear, NANTI creates the task or Waiting item. When a key detail is unclear, it asks one short clarification instead of inventing an answer.",
        },
        {
          title: "4. Keep talking to update it",
          description:
            "Say things like “yang tadi Jumat aja”, “udah beres yang invoice”, or “ingatkan 30 menit sebelum”. NANTI can reschedule, complete, edit, and add reminders conversationally.",
        },
        {
          title: "5. Ask NANTI what needs attention",
          description:
            "Ask “What am I forgetting?”, “What should I do today?”, “Who should I follow up with?”, or “What’s overdue?” and NANTI answers from your saved workspace.",
        },
      ],
    },
    boundary: {
      items: [
        {
          label: "It does not turn every sentence into a task.",
          description:
            "Casual conversation and status updates should stay conversation. NANTI only saves a new item when there is a real action, commitment, deadline, waiting item, or reminder intent.",
        },
        {
          label: "It does not guess when two things could be right.",
          description:
            "If “Budi” could mean two different people or “the meeting” could refer to two tasks, NANTI should ask which one you mean.",
        },
        {
          label: "It learns useful language over time.",
          description:
            "You can teach aliases and preferences such as “Pak B itu Budi” or a usual reminder preference. Learned context stays tied to your account.",
        },
        {
          label: "The public workflow is web-first today.",
          description:
            "Ask NANTI, paste conversation, screenshot import, tasks, Waiting, and in-app reminders are the current reliable flow. Calendar, push, and direct WhatsApp integrations are being hardened separately before we promise them as day-one essentials.",
        },
      ],
    },
    cta: {
      title: "Try NANTI with one real thing you need to remember.",
      description:
        "Use the way you normally type. NANTI should adapt to you, not the other way around.",
    },
  },
};

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <StoryPage copy={COPY} />
    </MarketingLayout>
  );
}
