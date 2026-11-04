import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { StoryPage, type StoryCopy } from "@/components/nanti/story-page";
import type { Bilingual } from "@/lib/i18n";
import { canonical } from "@/lib/site";

export const Route = createFileRoute("/business")({
  head: () => ({
    links: [canonical("/business")],
    meta: [
      { title: "NANTI untuk Bisnis" },
      {
        name: "description",
        content:
          "Ingatan kerja untuk pemilik bisnis dan operator yang mengurus janji ke klien, follow-up supplier, tenggat, dan hal yang ditunggu lewat chat.",
      },
    ],
  }),
  component: BusinessPage,
});

const COPY: Bilingual<StoryCopy> = {
  id: {
    hero: {
      eyebrow: "Untuk bisnis",
      titleA: "Bisnis Anda tidak butuh papan proyek lagi.",
      titleB: "Yang dibutuhkan: lebih sedikit janji yang terlupa.",
      description:
        "NANTI membantu pemilik bisnis dan operator mengubah janji di chat menjadi tugas, item Menunggu, pengingat, dan follow-up, lalu mengaturnya cukup dengan mengobrol.",
      note: "Dibuat untuk orang yang hari ini memegang semua konteks operasional. NANTI belum menjadi aplikasi manajemen proyek atau CRM untuk banyak pengguna.",
    },
    moment: {
      eyebrow: "Momen yang sering terjadi",
      title: "Seseorang berjanji di chat. Anda tetap harus mengingatnya.",
      body: "Daripada memindahkan janji itu manual ke sistem lain, bawa pesannya ke NANTI dan simpan di ingatan operasional Anda.",
      chat: {
        label: "Menunggu / follow-up supplier",
        userText: "Vendor bilang quotation dikirim besok, tolong catat gue nunggu",
        assistantText: "Siap. Quotation saya simpan di Menunggu dari Vendor.",
        saved: "Tersimpan di NANTI: Menunggu quotation vendor",
        footer:
          "Item Menunggu terpisah dari tugas Anda sendiri, jadi Anda bisa lihat apa yang bergantung pada orang lain.",
      },
    },
    proof: {
      eyebrow: "Yang dibantu NANTI",
      title: "Janji operasional kecil yang biasanya jatuh di antara sistem.",
      items: [
        {
          title: "Janji ke klien",
          description:
            "Simpan quotation, revisi, invoice, proposal, atau telepon balik yang Anda janjikan, termasuk orang dan tenggatnya kalau percakapannya jelas.",
        },
        {
          title: "Menunggu supplier & vendor",
          description:
            "Lacak apa yang dijanjikan orang lain untuk dikirim. Item Menunggu tetap terlihat sampai Anda tandai sudah diterima atau mencatat follow-up berikutnya.",
        },
        {
          title: "Prioritas harian",
          description:
            "Tanya apa yang lewat tenggat, jatuh tempo hari ini, atau masih ditunggu. NANTI menjawab dari tugas dan follow-up yang sudah tersimpan.",
        },
        {
          title: "Ubah tanpa kerja admin",
          description:
            "Jadwal ulang, ubah prioritas, selesaikan, hapus, atau pasang pengingat dengan mengobrol ke NANTI, tanpa membuka dan mengedit banyak kolom tugas.",
        },
        {
          title: "Konteks orang & proyek",
          description:
            "NANTI bisa mengingat orang yang sering muncul, nama proyek, alias, dan konteks terbaru, jadi frasa seperti “Pak B” atau “proyek TPS” makin berguna seiring waktu saat cocoknya jelas.",
        },
      ],
    },
    boundary: {
      title:
        "Berguna untuk operasional hari ini. Tidak berpura-pura menggantikan semua sistem Anda.",
      items: [
        {
          label: "Belum jadi workspace tim bersama.",
          description:
            "Saat ini NANTI paling cocok sebagai ingatan kerja pribadi untuk pemilik, manajer, atau operator. Belum ada penugasan banyak pengguna, hak akses, atau papan kolaborasi.",
        },
        {
          label: "Bukan pengganti CRM atau ERP.",
          description:
            "Pakai NANTI untuk mengingat janji dan follow-up di sekitar sistem yang sudah Anda pakai. NANTI tidak mencoba jadi database pelanggan, sistem akuntansi, atau aplikasi stok.",
        },
        {
          label: "Tidak semua chat tersimpan otomatis.",
          description:
            "Alur publik yang andal saat ini: tanya NANTI langsung, tempel percakapan yang relevan, atau unggah screenshot lalu cek hasilnya.",
        },
        {
          label: "Kalau ambigu, NANTI bertanya, bukan menebak.",
          description:
            "Kalau dua klien, proyek, atau tugas bisa cocok dengan frasa yang sama, NANTI akan memastikan dulu sebelum mengubah hal yang salah.",
        },
      ],
    },
    cta: {
      title: "Pakai NANTI untuk janji berikutnya yang Anda buat di chat.",
      description:
        "Mulai dari satu quotation, follow-up supplier, invoice, atau tenggat. Lihat apakah NANTI menjaganya tetap terlihat tanpa menambah kerja admin.",
    },
  },
  en: {
    hero: {
      eyebrow: "For business",
      titleA: "Your business does not need another board.",
      titleB: "It needs fewer forgotten promises.",
      description:
        "NANTI helps business owners and operators turn chat-driven commitments into tasks, Waiting items, reminders, and follow-ups, then lets you manage them by talking naturally.",
      note: "Built for the person carrying the operational context today. NANTI is not yet a shared multi-user project-management suite or CRM.",
    },
    moment: {
      eyebrow: "A common business moment",
      title: "Someone promises something in chat. You still have to remember it.",
      body: "Instead of moving the promise manually into another system, bring the message to NANTI and keep it in your operational memory.",
      chat: {
        label: "Waiting / supplier follow-up",
        userText: "Vendor bilang quotation dikirim besok, tolong catat gue nunggu",
        assistantText: "Got it. I’ll keep the quotation under Waiting for Vendor.",
        saved: "Saved to NANTI: Waiting for vendor quotation",
        footer:
          "Waiting items stay separate from your own tasks, so you can see what depends on someone else.",
      },
    },
    proof: {
      eyebrow: "What it helps with",
      title: "The small operational promises that usually fall between systems.",
      items: [
        {
          title: "Client commitments",
          description:
            "Save the quotation, revision, invoice, proposal, or callback you promised, including the person and deadline when the conversation makes them clear.",
        },
        {
          title: "Supplier & vendor waiting",
          description:
            "Track what someone else promised to send or deliver. Waiting items stay visible until you mark them received or record another follow-up.",
        },
        {
          title: "Daily priorities",
          description:
            "Ask what is overdue, due today, or still waiting. NANTI answers from the tasks and follow-ups already saved in your workspace.",
        },
        {
          title: "Changes without admin work",
          description:
            "Reschedule, reprioritize, complete, delete, or set a reminder by talking to NANTI instead of opening and editing multiple task fields.",
        },
        {
          title: "People & project context",
          description:
            "NANTI can remember recurring people, project names, aliases, and recent context so phrases like “Pak B” or “proyek TPS” can become more useful over time when the match is clear.",
        },
      ],
    },
    boundary: {
      title: "Useful for operations today. Not pretending to replace your whole stack.",
      items: [
        {
          label: "Not a shared team workspace yet.",
          description:
            "NANTI currently works best as a personal operating memory for an owner, manager, or operator. It does not yet offer full multi-user assignment, permissions, or collaborative boards.",
        },
        {
          label: "Not a CRM or ERP replacement.",
          description:
            "Use NANTI to remember commitments and follow-ups around the systems you already use. It is not trying to become your customer database, accounting system, or inventory platform.",
        },
        {
          label: "Not every chat is saved automatically.",
          description:
            "The reliable public workflow today is to ask NANTI directly, paste a relevant conversation, or upload a screenshot and review what it found.",
        },
        {
          label: "Ambiguity is a reason to ask, not guess.",
          description:
            "If two clients, projects, or tasks could match the same phrase, NANTI should clarify before changing the wrong thing.",
        },
      ],
    },
    cta: {
      title: "Use NANTI on the next promise you make in chat.",
      description:
        "Start with one quotation, supplier follow-up, invoice, or deadline. See whether NANTI keeps it visible without adding more admin work.",
    },
  },
};

function BusinessPage() {
  return (
    <MarketingLayout>
      <StoryPage copy={COPY} />
    </MarketingLayout>
  );
}
