import type { Bilingual } from "@/lib/i18n";

type Answer = { who: string; text: string; when?: string; tail?: string };

export type HomeCopy = {
  hero: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    note: string;
  };
  demo: {
    business: string;
    verified: string;
    forwardedLabel: string;
    forwardedTo: string;
    delivered: string;
    detected: string;
    saved: string;
    rows: { label: string; value: string; accent?: boolean }[];
    track: string;
    tracked: string;
    askLabel: string;
    askButton: string;
    placeholder: string;
    defaultQuery: string;
    tryLabel: string;
    chips: [label: string, query: string][];
    answers: Record<string, Answer>;
    fallback: (query: string) => Answer;
    answerTitle: string;
    answerSource: string;
    reminderTitle: string;
    reminderWhen: string;
    reminderText: string;
  };
  problem: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    body: string;
    closer: string;
    detectedLabel: string;
    quotes: { text: string; detected: string }[];
  };
  how: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    sub: string;
    preview: (n: number) => string;
    steps: {
      label: string;
      title: string;
      desc: string;
      footer: string;
      inspectorTitle: string;
      inspectorDesc: string;
    }[];
    outroA: string;
    outroB: string;
    outroBody: string;
    outroLink: string;
  };
  integrations: { eyebrow: string; title: string; items: [string, string, string] };
  privacy: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    sub: string;
    items: { title: string; desc: string; footer: string }[];
  };
  final: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    sub: string;
    cta: string;
    trust: string;
  };
};

/* The WhatsApp messages themselves stay in Indonesian in both versions: that is how the user's chats actually read. */
export const WA_DEMO_MESSAGE = "nanti saya kirim invoice tgl 28 agustus ya pak Tom";

export const HOME_COPY: Bilingual<HomeCopy> = {
  id: {
    hero: {
      eyebrow: "Mengingat janji Anda di WhatsApp",
      titleA: "Anda bicara.",
      titleB: "NANTI yang mengingat.",
      sub: "Teruskan pesan WhatsApp. NANTI menemukan janjinya, mencatat tenggatnya, dan mengingatkan Anda saat waktunya tiba.",
      ctaPrimary: "Coba NANTI gratis",
      ctaSecondary: "Lihat cara kerjanya",
      note: "Tanpa kartu kredit. Gratis selamanya.",
    },
    demo: {
      business: "WhatsApp Business",
      verified: "Bisnis terverifikasi",
      forwardedLabel: "Pesan diteruskan",
      forwardedTo: "Diteruskan ke NANTI",
      delivered: "Terkirim dan dibaca",
      detected: "Janji terdeteksi",
      saved: "Tersimpan di catatan",
      rows: [
        { label: "Siapa", value: "Pak Tom" },
        { label: "Apa", value: "Kirim invoice" },
        { label: "Kapan", value: "28 Agustus, 10.00", accent: true },
      ],
      track: "Catat janji",
      tracked: "Tercatat di WhatsApp",
      askLabel: "Tanya NANTI",
      askButton: "Tanya",
      placeholder: "Tanya NANTI apa saja dari chat Anda...",
      defaultQuery: "Apa yang saya janjikan ke Pak Tom?",
      tryLabel: "Coba:",
      chips: [
        ["Janji ke Pak Tom?", "Apa yang saya janjikan ke Pak Tom?"],
        ["Follow-up supplier", "Tenggat follow-up supplier"],
        ["Tenggat invoice", "Kapan invoice jatuh tempo?"],
      ],
      answers: {
        "Apa yang saya janjikan ke Pak Tom?": {
          who: "Pak Tom",
          text: "Kirim invoice paling lambat",
          when: "28 Agustus, 10.00",
          tail: "terdeteksi dari pesan WhatsApp yang diteruskan.",
        },
        "Tenggat follow-up supplier": {
          who: "PT Maju Supplier",
          text: "Follow-up pengiriman bahan baku dijanjikan",
          when: "Jumat 15.00",
          tail: "terdeteksi dari pesan WhatsApp yang diteruskan.",
        },
        "Kapan invoice jatuh tempo?": {
          who: "Kirim invoice",
          text: "28 Agustus, 10.00 untuk Pak Tom. Pengingat dipasang jam 09.00.",
        },
      },
      fallback: (q) => ({
        who: `Hasil untuk "${q}"`,
        text: "1 janji aktif ditemukan di arsip WhatsApp. Dijadwalkan untuk ditinjau.",
      }),
      answerTitle: "Jawaban NANTI",
      answerSource: "Ingatan WhatsApp",
      reminderTitle: "Pengingat dari NANTI",
      reminderWhen: "2 jam sebelum tenggat",
      reminderText: "Invoice untuk Pak Tom jatuh tempo jam 10.00 hari ini.",
    },
    problem: {
      eyebrow: "Masalahnya",
      titleA: "Sebagian besar janji Anda",
      titleB: "tidak pernah jadi tugas.",
      body: "Janji itu tersebar di banyak chat. Anda mengucapkannya sambil lalu, dengan niat baik. NANTI menangkapnya dan menjadikannya sesuatu yang bisa dilacak.",
      closer: "Anda yang bilang. NANTI yang ingat.",
      detectedLabel: "Terdeteksi",
      quotes: [
        { text: "Besok saya kirim revisinya ya Pak.", detected: "Besok, 09.00" },
        { text: "Nanti saya follow up suppliernya.", detected: "Follow-up supplier" },
        { text: "Saya kirim invoice tanggal 28.", detected: "Kirim invoice, tgl 28" },
      ],
    },
    how: {
      eyebrow: "Cara kerja",
      titleA: "Dari percakapan",
      titleB: "jadi tindakan.",
      sub: "Anda tidak perlu membuat papan proyek atau memilah tiket. Cukup mengobrol seperti biasa.",
      preview: (n) => `Pratinjau langkah ${n}`,
      steps: [
        {
          label: "Bicara",
          title: "Ngobrol seperti biasa",
          desc: "Percakapan Anda sudah berisi hal yang perlu dikerjakan. Teruskan saja pesannya ke NANTI.",
          footer: "Teruskan atau tempel",
          inspectorTitle: "Teruskan pesan ke NANTI",
          inspectorDesc: "Tekan lama pesan yang berisi janji, lalu teruskan ke kontak NANTI.",
        },
        {
          label: "Pahami",
          title: "Menangkap maksud",
          desc: "NANTI menemukan janji, siapa mengatakan apa, dan kapan tenggatnya.",
          footer: "Menemukan orang dan tanggal",
          inspectorTitle: "NANTI membaca pesannya",
          inspectorDesc:
            "NANTI menemukan orangnya (Pak Tom), tindakannya (kirim invoice), dan tenggatnya (28 Agustus, 10.00).",
        },
        {
          label: "Ingat",
          title: "Catatan janji",
          desc: "Lacak apa yang Anda janjikan dan apa yang Anda tunggu dari orang lain.",
          footer: "Tercatat tanpa ribet",
          inspectorTitle: "NANTI mencatat janjinya",
          inspectorDesc: "Masuk ke linimasa Anda. Tanpa papan atau daftar tugas yang harus diurus.",
        },
        {
          label: "Ingatkan",
          title: "Muncul tepat waktu",
          desc: "Saat waktunya tiba, NANTI mengirim pengingat lewat WhatsApp.",
          footer: "Pengingat dengan konteks",
          inspectorTitle: "NANTI mengirim pengingat",
          inspectorDesc:
            "Dua jam sebelum tenggat, NANTI mengirim pengingat: Invoice untuk Pak Tom jatuh tempo jam 10.00 hari ini.",
        },
      ],
      outroA: "Anda tidak perlu membuat tugas.",
      outroB: "Cukup bicara.",
      outroBody:
        "Teruskan pesan WhatsApp. NANTI menemukan janjinya, mencatat tenggatnya, dan mengingatkan Anda saat dibutuhkan.",
      outroLink: "Lihat cara kerja NANTI",
    },
    integrations: {
      eyebrow: "Integrasi",
      title: "Bekerja dengan aplikasi yang sudah Anda pakai",
      items: ["WhatsApp", "Google Calendar", "Layar kunci & widget"],
    },
    privacy: {
      eyebrow: "Privasi",
      titleA: "Percakapan Anda",
      titleB: "aman bersama kami.",
      sub: "Data Anda tetap milik Anda. Tanpa iklan, tanpa profiling, tidak dijual ke pihak ketiga.",
      items: [
        {
          title: "Terenkripsi saat dikirim dan disimpan",
          desc: "Data Anda dikirim lewat HTTPS dan disimpan dalam keadaan terenkripsi.",
          footer: "Tanpa iklan atau profiling",
        },
        {
          title: "Anda yang pegang kendali",
          desc: "Hapus data Anda kapan saja dari Pengaturan. Kami tidak pernah menjual atau membagikan informasi Anda ke pihak ketiga.",
          footer: "Hapus kapan saja",
        },
        {
          title: "Kami hanya mengambil yang penting",
          desc: "NANTI mencari janji dan tenggat di pesan Anda. Percakapan Anda tidak dipakai untuk iklan atau profiling.",
          footer: "Hanya ekstraksi janji",
        },
      ],
    },
    final: {
      eyebrow: "Mulai di sini",
      titleA: "Berhenti mengingat semuanya sendiri.",
      titleB: "Biar NANTI yang ingat hal yang penting.",
      sub: "Supaya kepala Anda tidak menanggung semuanya.",
      cta: "Coba NANTI gratis",
      trust: "Terenkripsi · Privat · Tanpa pelacakan",
    },
  },
  en: {
    hero: {
      eyebrow: "Remembers your WhatsApp commitments",
      titleA: "You talk.",
      titleB: "NANTI remembers.",
      sub: "Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and reminds you when it's time.",
      ctaPrimary: "Try NANTI for free",
      ctaSecondary: "See how it works",
      note: "No credit card required. Free forever.",
    },
    demo: {
      business: "WhatsApp Business",
      verified: "Verified business",
      forwardedLabel: "Forwarded message",
      forwardedTo: "Forwarded to NANTI",
      delivered: "Delivered and read",
      detected: "Commitment detected",
      saved: "Saved to Ledger",
      rows: [
        { label: "Who", value: "Pak Tom" },
        { label: "What", value: "Send invoice" },
        { label: "When", value: "28 August, 10:00 AM", accent: true },
      ],
      track: "Track commitment",
      tracked: "Tracked in WhatsApp",
      askLabel: "Ask NANTI",
      askButton: "Ask",
      placeholder: "Ask NANTI anything from your chats...",
      defaultQuery: "What did I promise Pak Tom?",
      tryLabel: "Try:",
      chips: [
        ["Promise Pak Tom?", "What did I promise Pak Tom?"],
        ["Supplier follow-up", "Follow-up supplier deadline"],
        ["Invoice deadline", "When is invoice due?"],
      ],
      answers: {
        "What did I promise Pak Tom?": {
          who: "Pak Tom",
          text: "Send invoice by",
          when: "28 August, 10:00 AM",
          tail: "detected from WhatsApp forwarded message.",
        },
        "Follow-up supplier deadline": {
          who: "PT Maju Supplier",
          text: "Follow-up raw materials shipment promised by",
          when: "Friday 15:00",
          tail: "detected from WhatsApp forwarded message.",
        },
        "When is invoice due?": {
          who: "Invoice Dispatch",
          text: "28 August, 10:00 AM for Pak Tom. Reminder set for 09:00 AM.",
        },
      },
      fallback: (q) => ({
        who: `Result for "${q}"`,
        text: "1 active commitment found in WhatsApp archive. Scheduled for review.",
      }),
      answerTitle: "NANTI Answer",
      answerSource: "WhatsApp Memory",
      reminderTitle: "Reminder from NANTI",
      reminderWhen: "2 hours before deadline",
      reminderText: "Invoice for Pak Tom is due at 10:00 AM today.",
    },
    problem: {
      eyebrow: "The problem",
      titleA: "Most of your commitments",
      titleB: "never become tasks.",
      body: "They live in scattered chat threads. You say it in passing, you promise in good faith. NANTI captures it and turns it into something trackable.",
      closer: "You said it. NANTI remembers it.",
      detectedLabel: "Detected",
      quotes: [
        { text: "Besok saya kirim revisinya ya Pak.", detected: "Due tomorrow, 09:00" },
        { text: "Nanti saya follow up suppliernya.", detected: "Supplier follow-up" },
        { text: "Saya kirim invoice tanggal 28.", detected: "Invoice dispatch, 28th" },
      ],
    },
    how: {
      eyebrow: "How it works",
      titleA: "From conversation",
      titleB: "to action.",
      sub: "You do not create project boards or categorize tickets. You simply converse.",
      preview: (n) => `Step ${n} Preview`,
      steps: [
        {
          label: "Talk",
          title: "Converse naturally",
          desc: "Your conversations already hold what needs to get done. Just forward a message to NANTI.",
          footer: "Forward or paste",
          inspectorTitle: "Forward the message to NANTI",
          inspectorDesc:
            "Long-press any message with a promise and forward it to the NANTI contact.",
        },
        {
          label: "Understand",
          title: "Extract intent",
          desc: "NANTI finds commitments, who said what, and when it is due.",
          footer: "Finds people and dates",
          inspectorTitle: "NANTI reads the message",
          inspectorDesc:
            "NANTI finds the person (Pak Tom), the action (Send invoice), and the deadline (28 August 10:00 AM).",
        },
        {
          label: "Remember",
          title: "Maintain ledger",
          desc: "Track what you promised and what you are waiting for from others.",
          footer: "Recorded quietly",
          inspectorTitle: "NANTI records the commitment",
          inspectorDesc: "Recorded into your timeline. No boards or task lists to manage.",
        },
        {
          label: "Follow up",
          title: "Gentle surfacing",
          desc: "When the time comes, NANTI sends a reminder back in WhatsApp.",
          footer: "Reminder with context",
          inspectorTitle: "NANTI sends the reminder",
          inspectorDesc:
            "Two hours before the deadline, NANTI sends a reminder: Invoice for Pak Tom is due at 10:00 AM today.",
        },
      ],
      outroA: "You do not create tasks.",
      outroB: "You just talk.",
      outroBody:
        "Forward a WhatsApp message. NANTI extracts the commitment, tracks the deadline, and reminds you when it matters.",
      outroLink: "See how NANTI works",
    },
    integrations: {
      eyebrow: "Integrations",
      title: "Works with the tools you already use",
      items: ["WhatsApp", "Google Calendar", "Lockscreen & Home Widget"],
    },
    privacy: {
      eyebrow: "Privacy",
      titleA: "Your conversations",
      titleB: "are safe with us.",
      sub: "Your data stays yours. No ads, no profiling, no selling to third parties.",
      items: [
        {
          title: "Encrypted in transit and at rest",
          desc: "Your data travels over HTTPS and is stored encrypted.",
          footer: "No ads or profiling",
        },
        {
          title: "You control your data",
          desc: "Delete your data anytime from Settings. We never sell or share your information with third parties.",
          footer: "Delete anytime",
        },
        {
          title: "We only extract what matters",
          desc: "NANTI finds commitments and deadlines in your messages. It does not use your conversations for advertising or profiling.",
          footer: "Commitment extraction only",
        },
      ],
    },
    final: {
      eyebrow: "Start here",
      titleA: "Stop remembering everything.",
      titleB: "Let NANTI remember what matters.",
      sub: "So you can stop holding it all in your head.",
      cta: "Try NANTI for free",
      trust: "Encrypted · Private · No tracking",
    },
  },
};
