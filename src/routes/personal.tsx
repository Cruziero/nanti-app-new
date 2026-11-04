import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { StoryPage, type StoryCopy } from "@/components/nanti/story-page";
import type { Bilingual } from "@/lib/i18n";
import { canonical } from "@/lib/site";

export const Route = createFileRoute("/personal")({
  head: () => ({
    links: [canonical("/personal")],
    meta: [
      { title: "NANTI untuk Pribadi" },
      {
        name: "description",
        content:
          "Ingatan kedua yang bisa diajak ngobrol, untuk janji temu, urusan, rencana, pengingat, dan hal kecil yang tidak ingin terus Anda pikirkan.",
      },
    ],
  }),
  component: PersonalPage,
});

const COPY: Bilingual<StoryCopy> = {
  id: {
    hero: {
      eyebrow: "Untuk kehidupan pribadi",
      titleA: "Ingatan kedua untuk hal-hal",
      titleB: "yang memang ingin Anda kerjakan.",
      description:
        "Ceritakan janji temu, urusan, rencana, atau pengingat ke NANTI dengan bahasa yang sama seperti saat chat dengan teman. NANTI bisa menyimpannya, mengingatkan Anda, dan membiarkan Anda mengubahnya nanti tanpa harus mengurus sistem yang rumit.",
      note: "NANTI hanya mengingat apa yang Anda bawa ke workspace NANTI. NANTI tidak diam-diam membaca chat pribadi Anda.",
    },
    moment: {
      eyebrow: "Ketik seperti biasa",
      title: "Pengingat yang berguna tidak butuh ejaan sempurna.",
      body: "NANTI dibuat untuk bahasa sehari-hari yang berantakan: singkatan, typo, Indonesia, Inggris, atau campuran dalam satu pesan.",
      chat: {
        label: "Rencana pribadi",
        userText: "besok jam 10 aku harus pulang dr puncak",
        assistantText: "Siap. Pulang dari Puncak besok jam 10.00.",
        saved: "Tersimpan di NANTI: Pulang dari Puncak",
        footer:
          "Nanti Anda bisa bilang “yang tadi jam 11 aja” atau “udah beres” tanpa membuat ulang tugasnya dari awal.",
      },
    },
    proof: {
      eyebrow: "Sehari-hari",
      title: "Janji temu, urusan, dan hal yang sedang Anda tunggu.",
      items: [
        {
          title: "Janji temu",
          description:
            "Simpan jadwal dokter, rapat, kelas, atau janji temu dengan tanggal dan jam yang Anda sebutkan. Tambah atau ubah pengingatnya nanti dengan mengobrol ke NANTI.",
        },
        {
          title: "Urusan & rencana",
          description:
            "Belanja, jemputan, waktu perjalanan, barang yang harus dibawa, telepon yang perlu dilakukan, dan rencana yang tidak ingin terus Anda hafalkan.",
        },
        {
          title: "Hal yang ditunggu dari orang lain",
          description:
            "Pakai Menunggu saat Anda menunggu dokumen, balasan, pembayaran, konfirmasi reservasi, atau apa pun dari orang lain.",
        },
        {
          title: "Tanya, tidak perlu mencari",
          description:
            "Tanya “Apa yang saya lupa?”, “Hari ini harus ngapain?”, atau “Apa yang sudah lewat tenggat?” dan NANTI menjawab dari workspace Anda.",
        },
        {
          title: "Bahasa Anda sendiri",
          description:
            "Ajarkan alias atau preferensi kalau perlu. NANTI bisa ingat bahwa “Pak B” itu Budi, atau bahwa Anda suka diingatkan di waktu tertentu.",
        },
      ],
    },
    boundary: {
      title: "NANTI mengingat apa yang Anda pilih untuk dibawa.",
      items: [
        {
          label: "NANTI tidak membaca semua percakapan pribadi Anda.",
          description:
            "Ketik sesuatu di Tanya NANTI, tempel percakapan yang relevan, atau unggah screenshot. Itulah konteks yang NANTI pakai.",
        },
        {
          label: "NANTI tidak menyimpan setiap obrolan santai.",
          description:
            "Ulang tahun, restoran, atau rencana baru jadi sesuatu yang dilacak kalau niatnya cukup jelas, atau kalau Anda secara eksplisit meminta NANTI mengingatnya.",
        },
        {
          label: "NANTI bisa bertanya satu hal.",
          description:
            "Kalau Anda bilang “ingatkan nanti” tanpa konteks yang cukup, NANTI akan bertanya apa atau kapan, bukan diam-diam memilih yang salah.",
        },
        {
          label: "NANTI adalah lapisan ingatan, bukan pemantau hidup Anda.",
          description:
            "NANTI membantu Anda menjaga janji dan pengingat pilihan tetap rapi. NANTI tidak memantau ponsel, kontak, atau percakapan Anda di latar belakang.",
        },
      ],
    },
    cta: {
      title: "Berikan NANTI pengingat yang terus Anda tunda.",
      description:
        "Mulai dari janji temu, urusan, follow-up, atau rencana yang nyata. Pakai bahasa Anda sehari-hari.",
    },
  },
  en: {
    hero: {
      eyebrow: "For personal life",
      titleA: "A second memory for the things",
      titleB: "you actually mean to do.",
      description:
        "Tell NANTI about an appointment, errand, plan, or reminder in the same language you would text a friend. NANTI can save it, remind you, and let you change it later without making you manage another complicated system.",
      note: "NANTI only remembers what you bring into your NANTI workspace. It does not silently read your private chats.",
    },
    moment: {
      eyebrow: "Type like yourself",
      title: "You should not need perfect spelling to set a useful reminder.",
      body: "NANTI is built around messy everyday language: shorthand, typos, Indonesian, English, or both in the same message.",
      chat: {
        label: "Personal plan",
        userText: "besok jam 10 aku harus pulang dr puncak",
        assistantText: "Got it. Pulang dari Puncak tomorrow at 10:00.",
        saved: "Saved to NANTI: Pulang dari Puncak",
        footer:
          "Later you can say “yang tadi jam 11 aja” or “udah beres” without rebuilding the task from scratch.",
      },
    },
    proof: {
      eyebrow: "Everyday use",
      title: "Appointments, errands, and things you are waiting on.",
      items: [
        {
          title: "Appointments",
          description:
            "Save a doctor visit, meeting, class, or appointment with the date and time you actually mentioned. Add or change the reminder later by talking to NANTI.",
        },
        {
          title: "Errands & plans",
          description:
            "Groceries, pickups, travel timing, things to bring, calls to make, and plans you do not want to keep rehearsing in your head.",
        },
        {
          title: "Things someone else owes you",
          description:
            "Use Waiting when you are expecting a document, reply, payment, reservation confirmation, or anything else from another person.",
        },
        {
          title: "Ask instead of search",
          description:
            "Ask “What am I forgetting?”, “What do I need to do today?”, or “What’s overdue?” and NANTI answers from your saved workspace.",
        },
        {
          title: "Your own language",
          description:
            "Teach useful aliases or preferences when needed. NANTI can remember that “Pak B” means Budi or that you prefer a certain reminder timing.",
        },
      ],
    },
    boundary: {
      title: "NANTI remembers what you choose to bring in.",
      items: [
        {
          label: "It does not read all of your private conversations.",
          description:
            "Type something into Ask NANTI, paste the relevant conversation, or upload a screenshot. That is the context NANTI works from.",
        },
        {
          label: "It does not save every casual mention.",
          description:
            "A birthday, restaurant, or plan only becomes something trackable when there is enough intent to save it, or when you explicitly ask NANTI to remember it.",
        },
        {
          label: "It can ask one clarification.",
          description:
            "If you say “remind me later” without enough context, NANTI should ask what or when rather than silently choosing the wrong thing.",
        },
        {
          label: "It is a memory layer, not a life feed.",
          description:
            "NANTI helps you keep selected commitments and reminders organized. It is not monitoring your phone, contacts, or conversations in the background.",
        },
      ],
    },
    cta: {
      title: "Give NANTI the reminder you keep rescheduling.",
      description:
        "Start with a real appointment, errand, follow-up, or plan. Use your normal language.",
    },
  },
};

function PersonalPage() {
  return (
    <MarketingLayout>
      <StoryPage copy={COPY} />
    </MarketingLayout>
  );
}
