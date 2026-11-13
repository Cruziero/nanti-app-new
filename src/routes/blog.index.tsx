import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { articles as staticArticles } from "@/data/articles";
import { fetchPublishedArticles, type BlogArticle } from "@/lib/nanti-blog";
import { articleLang } from "@/lib/nanti-articles";
import { canonical } from "@/lib/site";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    links: [canonical("/blog")],
    meta: [
      { title: "Blog · NANTI" },
      {
        name: "description",
        content:
          "Practical tips for WhatsApp work: client follow-ups, invoice reminders, promises and groups. In Bahasa Indonesia and English.",
      },
    ],
  }),
  loader: async () => {
    try {
      const dbArticles = await fetchPublishedArticles();
      return { dbArticles };
    } catch {
      return { dbArticles: null };
    }
  },
  component: BlogPage,
});

type ListArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image?: string;
};

type LangFilter = "all" | "id" | "en";

const FILTERS: { value: LangFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
];

function BlogPage() {
  const { dbArticles } = Route.useLoaderData();
  const [filter, setFilter] = useState<LangFilter>("all");

  const all: ListArticle[] = mergeArticles(
    (dbArticles ?? []).map((a: BlogArticle) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      date: a.date,
      readTime: a.read_time,
    })),
    staticArticles,
  );
  const articles = filter === "all" ? all : all.filter((a) => articleLang(a.category) === filter);
  const [featured, ...rest] = articles;

  return (
    <MarketingLayout>
      <section className="bg-white pt-24 pb-10 sm:pt-32 sm:pb-12">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          <Reveal>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#067a3f]">
              NANTI Blog
            </p>
            <h1 className="mt-3 max-w-[640px] text-[32px] font-bold leading-[1.15] tracking-tight text-[#111111] sm:text-[42px]">
              Tips for getting WhatsApp work done
            </h1>
            <p className="mt-4 max-w-[600px] text-[16px] leading-[1.6] text-[#4a4f54]">
              Follow-ups, invoice reminders, promises and busy groups. Short guides with messages
              you can copy, in Bahasa Indonesia and English.
            </p>
          </Reveal>

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Language">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${
                  filter === f.value
                    ? "border-[#01504b] bg-[#01504b] text-white"
                    : "border-[#DADDD9] bg-white text-[#3c4043] hover:border-[#067a3f] hover:text-[#067a3f]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8F6] py-12 sm:py-16">
        <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
          {featured && <FeaturedCard article={featured} />}

          {rest.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          )}

          {articles.length === 0 && (
            <p className="text-[15px] text-[#4a4f54]">No articles in this language yet.</p>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}

function FeaturedCard({ article }: { article: ListArticle }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: article.slug }}
      className="group grid overflow-hidden rounded-2xl border border-[#E7E9E7] bg-white transition-colors hover:border-[#067a3f]/40 md:grid-cols-[1.25fr_1fr]"
    >
      <Cover article={article} eager />
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <Meta article={article} />
        <h2 className="mt-3 text-[24px] font-bold leading-[1.25] tracking-tight text-[#111111] transition-colors group-hover:text-[#067a3f] sm:text-[28px]">
          {article.title}
        </h2>
        <p className="mt-3 text-[15px] leading-[1.6] text-[#4a4f54]">{article.excerpt}</p>
        <span className="mt-5 text-[14px] font-semibold text-[#067a3f]">
          {articleLang(article.category) === "id" ? "Baca artikel →" : "Read article →"}
        </span>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: ListArticle }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: article.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E9E7] bg-white transition-colors hover:border-[#067a3f]/40"
    >
      <Cover article={article} />
      <div className="flex flex-1 flex-col p-5">
        <Meta article={article} />
        <h2 className="mt-2.5 text-[17px] font-semibold leading-[1.35] text-[#111111] transition-colors group-hover:text-[#067a3f]">
          {article.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-[14px] leading-[1.6] text-[#4a4f54]">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}

function Cover({ article, eager = false }: { article: ListArticle; eager?: boolean }) {
  if (article.image) {
    return (
      <img
        src={article.image}
        alt=""
        width={1200}
        height={630}
        loading={eager ? "eager" : "lazy"}
        className="aspect-[1200/630] w-full bg-white object-cover"
      />
    );
  }
  // Database articles have no cover yet: show a plain brand panel instead of an empty box.
  return (
    <div className="flex aspect-[1200/630] w-full items-end bg-[#e8f9ee] p-5">
      <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#01504b]">
        {article.category}
      </span>
    </div>
  );
}

function Meta({ article }: { article: ListArticle }) {
  const lang = articleLang(article.category);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#5F6368]">
      <span className="font-semibold text-[#067a3f]">{article.category}</span>
      <span>{formatDate(article.date, lang)}</span>
      <span className="flex items-center gap-1">
        <Clock className="size-3" aria-hidden />
        {article.readTime}
      </span>
    </div>
  );
}

function formatDate(date: string, lang: "id" | "en") {
  return new Date(date).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Show database articles and built-in articles together, newest first.
 * If both have the same slug, the database version wins.
 */
function mergeArticles<T extends { slug: string; date: string }>(db: T[], builtIn: T[]): T[] {
  const seen = new Set(db.map((a) => a.slug));
  return [...db, ...builtIn.filter((a) => !seen.has(a.slug))].sort((a, b) =>
    String(b.date).localeCompare(String(a.date)),
  );
}
