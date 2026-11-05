/**
 * Daily SEO/GEO articles for nanti.site/blog: one Indonesian and one English per day.
 *
 * SEO: each topic targets a real search query, used in the title and first paragraph.
 * GEO (generative engine optimization): answer-first opening, question headings,
 * numbered steps, copyable message examples and an FAQ block, so AI search tools
 * can quote the article directly.
 *
 * No imports, so tests can load this file directly.
 */

export type ArticleLang = "id" | "en";

export type Topic = { title: string; query: string; category: string };

/*
 * Listicle style ("7 Template ...", "10 Contoh ...") is what people click and what AI
 * answers like to quote. `title` is the headline to aim for; `query` is what people search.
 * Topics that compare other companies' products are NOT here on purpose: those need
 * fresh research and are written by the daily Claude task instead.
 */
export const TOPICS: Record<ArticleLang, Topic[]> = {
  id: [
    {
      title: "7 Template Pesan Tagih Invoice yang Sopan (Tinggal Copy)",
      query: "template pesan tagih invoice yang sopan",
      category: "Bisnis",
    },
    {
      title: "10 Contoh Pesan Follow Up Klien yang Nggak Bikin Risih",
      query: "contoh pesan follow up klien",
      category: "Komunikasi",
    },
    {
      title: "5 Cara Biar Nggak Lupa Janji di WhatsApp",
      query: "cara mengingat janji kerja di WhatsApp",
      category: "Produktivitas",
    },
    {
      title: "7 Cara Mengatur Banyak Grup WhatsApp Kerja",
      query: "cara mengatur banyak grup WhatsApp kerja",
      category: "Tips WhatsApp",
    },
    {
      title: "8 Contoh Pesan Follow Up Supplier yang Sopan",
      query: "contoh pesan follow up supplier",
      category: "Bisnis",
    },
    {
      title: "8 Kesalahan Chat WhatsApp yang Bikin Klien Kabur",
      query: "kesalahan chat WhatsApp dengan klien",
      category: "Komunikasi",
    },
    {
      title: "6 Tips Manajemen Waktu untuk Pemilik UMKM",
      query: "tips manajemen waktu untuk pemilik UMKM",
      category: "UMKM",
    },
    {
      title: "5 Cara Menagih Pembayaran Klien yang Telat Tanpa Ribut",
      query: "cara menagih pembayaran klien yang telat",
      category: "Bisnis",
    },
    {
      title: "6 Cara Mencatat Order dari WhatsApp Biar Nggak Tercecer",
      query: "cara mencatat order dari WhatsApp",
      category: "UMKM",
    },
    {
      title: "7 Alasan Kita Sering Lupa Janji (dan Cara Mengatasinya)",
      query: "kenapa sering lupa janji",
      category: "Produktivitas",
    },
    {
      title: "10 Langkah Follow Up Penjualan untuk Sales",
      query: "checklist follow up penjualan untuk sales",
      category: "Penjualan",
    },
    {
      title: "7 Template Balas Chat Pelanggan yang Cepat dan Rapi",
      query: "template balas chat pelanggan WhatsApp",
      category: "Komunikasi",
    },
    {
      title: "5 Cara Mengelola Tugas Tanpa Aplikasi To-Do yang Ribet",
      query: "cara mengelola tugas tanpa aplikasi to-do",
      category: "Produktivitas",
    },
    {
      title: "9 Etika Chat WhatsApp dengan Klien dan Atasan",
      query: "etika chat WhatsApp dengan klien dan atasan",
      category: "Komunikasi",
    },
    {
      title: "5 Cara Mencatat Hasil Rapat dari Chat WhatsApp",
      query: "cara mencatat hasil rapat dari chat WhatsApp",
      category: "Produktivitas",
    },
    {
      title: "6 Contoh Pesan Mengingatkan Rekan Kerja Tanpa Canggung",
      query: "cara mengingatkan rekan kerja tanpa canggung",
      category: "Komunikasi",
    },
    {
      title: "5 Langkah Bikin Sistem Follow Up untuk Bisnis Kecil",
      query: "sistem follow up untuk bisnis kecil",
      category: "Bisnis",
    },
    {
      title: "5 Cara Melacak Barang yang Dijanjikan Orang Lain",
      query: "cara melacak barang atau dokumen yang dijanjikan",
      category: "Produktivitas",
    },
    {
      title: "6 Tips Mengatur Jadwal Kirim ke Pelanggan",
      query: "cara mengatur jadwal pengiriman ke pelanggan",
      category: "UMKM",
    },
    {
      title: "7 Kebiasaan Kerja Lewat WhatsApp yang Bikin Lebih Produktif",
      query: "tips produktif kerja lewat WhatsApp",
      category: "Tips WhatsApp",
    },
  ],
  en: [
    {
      title: "7 Polite Payment Reminder Templates You Can Copy",
      query: "polite payment reminder message templates",
      category: "Business",
    },
    {
      title: "10 Client Follow-Up Messages That Don't Feel Pushy",
      query: "client follow-up message examples",
      category: "Communication",
    },
    {
      title: "5 Ways to Stop Forgetting Promises Made on WhatsApp",
      query: "how to keep track of promises made in WhatsApp chats",
      category: "Productivity",
    },
    {
      title: "7 Ways to Manage Too Many WhatsApp Work Groups",
      query: "how to manage many WhatsApp groups for work",
      category: "WhatsApp Tips",
    },
    {
      title: "8 Supplier Follow-Up Message Examples That Work",
      query: "supplier follow-up message examples",
      category: "Business",
    },
    {
      title: "8 WhatsApp Mistakes That Make Clients Walk Away",
      query: "WhatsApp mistakes with clients",
      category: "Communication",
    },
    {
      title: "6 Time Management Tips for Small Business Owners",
      query: "time management tips for small business owners",
      category: "Small Business",
    },
    {
      title: "5 Ways to Chase Late Payments Without a Fight",
      query: "how to chase late payments from clients politely",
      category: "Business",
    },
    {
      title: "6 Ways to Track Orders That Come In Through WhatsApp",
      query: "how to track customer orders from WhatsApp",
      category: "Small Business",
    },
    {
      title: "7 Reasons We Forget Commitments (and How to Fix It)",
      query: "why we forget commitments",
      category: "Productivity",
    },
    {
      title: "A 10-Step Sales Follow-Up Checklist",
      query: "sales follow-up checklist",
      category: "Sales",
    },
    {
      title: "7 Customer Reply Templates for WhatsApp",
      query: "WhatsApp customer reply templates",
      category: "Communication",
    },
    {
      title: "5 Ways to Manage Tasks Without a Complicated To-Do App",
      query: "simple task management without to-do apps",
      category: "Productivity",
    },
    {
      title: "9 WhatsApp Etiquette Rules for Clients and Managers",
      query: "WhatsApp etiquette with clients and managers",
      category: "Communication",
    },
    {
      title: "5 Ways to Turn Chat Discussions into Action Items",
      query: "how to turn chat discussions into action items",
      category: "Productivity",
    },
    {
      title: "6 Ways to Remind a Coworker Without Being Awkward",
      query: "how to remind a coworker politely",
      category: "Communication",
    },
    {
      title: "5 Steps to a Simple Follow-Up System for a Small Business",
      query: "simple follow-up system for small business",
      category: "Business",
    },
    {
      title: "5 Ways to Track What Other People Owe You",
      query: "how to keep a waiting-for list",
      category: "Productivity",
    },
    {
      title: "6 Tips to Plan Customer Deliveries Without Missing Dates",
      query: "how to plan customer deliveries",
      category: "Small Business",
    },
    {
      title: "7 WhatsApp Work Habits That Make You More Productive",
      query: "productivity tips for working in WhatsApp",
      category: "WhatsApp Tips",
    },
  ],
};

/** Topics for a day, rotating; callers skip any whose slug already exists. */
export function topicsForDay(lang: ArticleLang, dayIndex: number): Topic[] {
  const list = TOPICS[lang];
  return list.map((_, i) => list[(dayIndex + i) % list.length]!);
}

/* What NANTI can truthfully be said to do. Matches src/lib/nanti-support.ts. */
const NANTI_FACTS = `NANTI (nanti.site) is a web app that turns chat conversations into tracked tasks, promises, deadlines, "Waiting" items (things other people promised you) and reminders.
Verified, working today: type in "Ask NANTI" / "Tanya NANTI"; paste a copied WhatsApp chat or upload a chat screenshot; NANTI finds who, what and when; edit items by chatting ("move it to Friday", "done"); in-app reminders, daily briefing, browser push notifications; understands Indonesian, English, mixed language and typos; free plan (up to 50 tracked items, no credit card).
NOT available yet, never claim: forwarding directly from WhatsApp, WhatsApp reminders, Google Calendar sync, team workspaces, mobile app store apps, online payment.`;

export function buildArticlePrompt(lang: ArticleLang, topic: Topic) {
  const language =
    lang === "id"
      ? "Bahasa Indonesia yang santai tapi sopan (pakai 'kamu'), seperti blog tips populer, untuk pemilik usaha, sales, dan pekerja kantoran di Indonesia."
      : "Clear, plain English for small-business owners, sales people and office workers (many in Indonesia and Southeast Asia).";
  return `Write one blog article for the NANTI blog.

Target search query: "${topic.query}"
Headline to use (you may polish it, keep the number and the listicle format): "${topic.title}"
Language: ${language}
Category: ${topic.category}

SEO
- Title: max 60 characters, numbered listicle style like the headline above, includes the main words of the query naturally. No clickbait.
- The body must deliver exactly as many numbered items as the headline promises, each as a "## <number>. <item>" heading followed by practical detail.
- Excerpt: a meta description of 120 to 155 characters that answers the query.
- Use the query wording naturally in the first paragraph and in one ## heading.

GEO (so AI search tools can quote it)
- First paragraph: answer the query directly in 2 or 3 sentences. No intro fluff.
- ## headings phrased the way people search (questions or "how to").
- Include numbered steps (lines starting "1. ", "2. ") and at least two ready-to-copy chat message examples written as plain paragraphs starting with "Contoh pesan:" (Indonesian) or "Example message:" (English).
- End with "## FAQ" containing 3 or 4 questions, each as "### <question>" followed by a 1 to 3 sentence answer.
- Include a short "Key takeaways" list ("- " bullets) before the FAQ ("## Ringkasan" in Indonesian).

CONTENT RULES
- 700 to 1000 words. Practical and specific to WhatsApp-based work (clients, suppliers, groups, Pak/Bu, invoices, orders).
- NEVER invent statistics, percentages, studies, surveys, experts, quotes, customer names, testimonials or case studies.
- Mention NANTI at most twice, only near the end, only with the verified facts below, as one option among good habits. Do not overpromise.
- No em dashes. No words like "revolutionary", "game-changer", "seamless", "unlock", "elevate", "delve".
- Markdown only: "## ", "### ", "- ", "1. ", **bold**. No tables, no links, no images, no title heading.

FACTS ABOUT NANTI
${NANTI_FACTS}

Return ONLY JSON, no code fences:
{"title":"...","excerpt":"...","content":"...markdown with \\n newlines..."}`;
}

export type GeneratedArticle = { title: string; excerpt: string; content: string };

/** Pull the JSON object out of a model reply, tolerating code fences. */
export function parseArticleJson(text: string): GeneratedArticle {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1]! : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in reply");
  const obj = JSON.parse(raw.slice(start, end + 1)) as Partial<GeneratedArticle>;
  if (!obj.title || !obj.excerpt || !obj.content)
    throw new Error("Missing title, excerpt or content");
  return {
    title: obj.title.trim(),
    excerpt: obj.excerpt.trim(),
    content: obj.content.replace(/\r\n/g, "\n").trim(),
  };
}

/* Claims an article must never make. A hit keeps the article unpublished for review. */
const RISKY: { label: string; re: RegExp }[] = [
  { label: "percentage statistic", re: /\d+(?:[.,]\d+)?\s?(?:%|persen\b|percent\b)/i },
  {
    label: "cited study or survey",
    re: /\b(studi|penelitian|riset|survei|survey|study|studies|research shows|according to|menurut data)\b/i,
  },
  {
    label: "testimonial or case study",
    re: /\b(testimoni|testimonial|case study|studi kasus|pengguna kami|our users|our customers|pelanggan kami)\b/i,
  },
  {
    label: "claims WhatsApp forwarding works",
    re: /(forward|teruskan|meneruskan)[^.\n]{0,60}(ke|to) (kontak )?NANTI/i,
  },
  {
    label: "claims Google Calendar",
    re: /NANTI[^.\n]{0,80}(google calendar|kalender google)|(google calendar|kalender google)[^.\n]{0,80}NANTI/i,
  },
  {
    label: "claims team workspace",
    re: /NANTI[^.\n]{0,80}\b(tim|team)\b[^.\n]{0,40}(workspace|kolaborasi|collaborat|berbagi|share)/i,
  },
  { label: "claims app store app", re: /\b(play store|app store)\b/i },
  { label: "claims end-to-end encryption", re: /end[- ]to[- ]end/i },
];

export type ArticleCheck = { ok: boolean; problems: string[]; words: number };

export function checkArticle(a: GeneratedArticle): ArticleCheck {
  const problems: string[] = [];
  const text = `${a.title}\n${a.excerpt}\n${a.content}`;
  const words = a.content.split(/\s+/).filter(Boolean).length;
  if (words < 500) problems.push(`too short (${words} words)`);
  if (a.title.length > 70) problems.push(`title too long (${a.title.length} chars)`);
  if (a.excerpt.length > 170) problems.push(`excerpt too long (${a.excerpt.length} chars)`);
  if (/—/.test(text)) problems.push("contains em dash");
  if (!/^## FAQ\b/m.test(a.content)) problems.push("missing ## FAQ section");
  if ((a.content.match(/^### /gm) ?? []).length < 3)
    problems.push("FAQ needs at least 3 questions");
  if (!/^(?:## )?1\. /m.test(a.content)) problems.push("missing numbered steps");
  const mentions = (a.content.match(/\bNANTI\b/g) ?? []).length;
  if (mentions > 3) problems.push(`mentions NANTI ${mentions} times`);
  for (const r of RISKY) if (r.re.test(text)) problems.push(r.label);
  return { ok: problems.length === 0, problems, words };
}

export function makeSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function readTime(content: string, lang: ArticleLang) {
  const minutes = Math.max(2, Math.round(content.split(/\s+/).length / 200));
  return lang === "id" ? `${minutes} menit` : `${minutes} min`;
}

/** FAQ pairs from the "## FAQ" section, for FAQPage structured data. */
export function extractFaq(content: string): { q: string; a: string }[] {
  const idx = content.search(/^## FAQ\b/m);
  if (idx < 0) return [];
  const section = content.slice(idx).split(/\n(?=## (?!#))/)[0]!;
  const out: { q: string; a: string }[] = [];
  const parts = section.split(/^### /m).slice(1);
  for (const part of parts) {
    const [q, ...rest] = part.split("\n");
    const a = rest.join(" ").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    if (q && a) out.push({ q: q.trim(), a });
  }
  return out;
}

/** Article language from its category, since the table has no language column. */
export function articleLang(category: string): ArticleLang {
  return TOPICS.id.some((t) => t.category === category) &&
    !TOPICS.en.some((t) => t.category === category)
    ? "id"
    : "en";
}
