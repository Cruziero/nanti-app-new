import type { ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { articles as staticArticles } from "@/data/articles";
import { fetchArticleBySlug, type BlogArticle } from "@/lib/nanti-blog";
import { canonical, OG_IMAGE_URL, SITE_URL } from "@/lib/site";
import { articleLang, extractFaq } from "@/lib/nanti-articles";

/** Built-in articles carry a cover; database articles fall back to it by slug when one exists. */
function coverFor(slug: string, image?: string) {
  return image ?? staticArticles.find((a) => a.slug === slug)?.image;
}

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params, loaderData }) => {
    // Database articles come from the loader; the old static list is only a fallback.
    const article =
      (
        loaderData as
          | {
              article?: {
                title: string;
                excerpt: string;
                date: string;
                category: string;
                content: string;
                image?: string;
              };
            }
          | undefined
      )?.article ??
      staticArticles.find((a) => a.slug === params.slug) ??
      null;
    if (!article) return {};
    const url = `${SITE_URL}/blog/${params.slug}`;
    const cover = coverFor(params.slug, article.image);
    const imageUrl = cover ? `${SITE_URL}${cover}` : OG_IMAGE_URL;
    const faq = extractFaq(article.content);
    const structured: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.excerpt,
        image: imageUrl,
        datePublished: article.date,
        inLanguage: articleLang(article.category) === "id" ? "id-ID" : "en",
        articleSection: article.category,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "NANTI", url: SITE_URL },
        publisher: { "@type": "Organization", name: "NANTI", url: SITE_URL },
      },
    ];
    if (faq.length > 0) {
      structured.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }
    return {
      links: [canonical(`/blog/${params.slug}`)],
      scripts: structured.map((data) => ({
        type: "application/ld+json",
        children: JSON.stringify(data),
      })),
      meta: [
        { title: `${article.title} · NANTI Blog` },
        { name: "description", content: article.excerpt },
        { property: "og:title", content: `${article.title} · NANTI Blog` },
        { property: "og:description", content: article.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: imageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: imageUrl },
        { property: "article:published_time", content: article.date },
        { property: "article:section", content: article.category },
      ],
    };
  },
  loader: async ({ params }) => {
    try {
      const dbArticle = await fetchArticleBySlug(params.slug);
      if (dbArticle) return { article: dbArticle };
    } catch {
      // fall through to static
    }
    const staticArticle = staticArticles.find((a) => a.slug === params.slug);
    if (!staticArticle) throw notFound();
    return { article: staticArticle };
  },
  component: ArticlePage,
});

const COPY = {
  id: {
    back: "Kembali ke blog",
    message: "Contoh pesan",
    summary: "Ringkasan",
    ctaTitle: "Mau coba NANTI?",
    ctaBody:
      "Tempel chat WhatsApp atau upload screenshot, lalu NANTI mencatat siapa, apa, dan kapan. Gratis sampai 50 item.",
    ctaButton: "Coba NANTI gratis",
  },
  en: {
    back: "Back to blog",
    message: "Example message",
    summary: "Key takeaways",
    ctaTitle: "Want to try NANTI?",
    ctaBody:
      "Paste a WhatsApp chat or upload a screenshot, and NANTI notes who, what and when. Free for up to 50 items.",
    ctaButton: "Try NANTI for free",
  },
} as const;

function ArticlePage() {
  const { article } = Route.useLoaderData();

  const slug = (article as BlogArticle).slug ?? article.slug;
  const title = (article as BlogArticle).title ?? article.title;
  const category = (article as BlogArticle).category ?? article.category;
  const readTime = (article as BlogArticle).read_time ?? article.readTime;
  const date = (article as BlogArticle).date ?? article.date;
  const content = (article as BlogArticle).content ?? article.content;
  const image = coverFor(slug, (article as { image?: string }).image);
  const lang = articleLang(category);
  const t = COPY[lang];

  return (
    <MarketingLayout>
      <article className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-24">
        <header className="mx-auto max-w-[720px] px-5 sm:px-8">
          <Reveal>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#5F6368] transition-colors hover:text-[#067a3f]"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t.back}
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#5F6368]">
              <span className="font-semibold text-[#067a3f]">{category}</span>
              <span>
                {new Date(date).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {readTime}
              </span>
            </div>

            <h1 className="mt-4 text-[30px] font-bold leading-[1.18] tracking-tight text-[#111111] sm:text-[40px]">
              {title}
            </h1>
          </Reveal>
        </header>

        {image && (
          <div className="mx-auto mt-8 max-w-[880px] px-5 sm:px-8">
            <img
              src={image}
              alt=""
              width={1200}
              height={630}
              className="aspect-[1200/630] w-full rounded-2xl border border-[#E7E9E7] bg-white object-cover"
            />
          </div>
        )}

        <div className="mx-auto mt-10 max-w-[720px] px-5 sm:px-8">
          <ArticleBody content={content} messageLabel={t.message} />

          <aside className="mt-14 rounded-2xl bg-[#01504b] p-6 text-white sm:p-8">
            <p className="text-[19px] font-bold">{t.ctaTitle}</p>
            <p className="mt-2 text-[15px] leading-[1.6] text-white/85">{t.ctaBody}</p>
            <Link
              to="/welcome"
              className="mt-5 inline-flex items-center rounded-xl bg-[#02c359] px-5 py-3 text-[15px] font-semibold text-[#01302d] transition-colors hover:bg-[#3ad97f]"
            >
              {t.ctaButton}
            </Link>
          </aside>
        </div>
      </article>
    </MarketingLayout>
  );
}

const MESSAGE_PREFIX = /^(Contoh pesan|Example message)\s*:\s*/i;
const SUMMARY_HEADING = /^(Ringkasan|Key takeaways)$/i;

/**
 * Renders the article's small markdown subset ("## ", "### ", "- ", "1. ", **bold**)
 * with reading-friendly styling: example messages become chat bubbles and the
 * summary list sits in its own box.
 */
function ArticleBody({ content, messageLabel }: { content: string; messageLabel: string }) {
  const blocks = content
    .split("\n\n")
    .map((b) => b.trim())
    .filter(Boolean);
  const out: ReactNode[] = [];
  let section = "";

  blocks.forEach((block, i) => {
    if (block.startsWith("## ")) {
      section = block.replace(/^##\s+/, "").trim();
      if (SUMMARY_HEADING.test(section)) return; // the summary box renders its own title
      out.push(
        <h2
          key={i}
          className="mt-12 scroll-mt-24 text-[22px] font-bold leading-[1.3] tracking-tight text-[#111111] sm:text-[25px]"
        >
          {section}
        </h2>,
      );
      return;
    }

    if (block.startsWith("### ")) {
      const [heading, ...rest] = block.split("\n");
      out.push(
        <div key={i} className="mt-4 rounded-xl border border-[#E7E9E7] p-5">
          <h3 className="text-[17px] font-semibold leading-[1.4] text-[#111111]">
            {heading!.replace(/^###\s+/, "")}
          </h3>
          {rest.length > 0 && (
            <p className="mt-2 text-[16px] leading-[1.7] text-[#3c4043]">
              {renderInline(rest.join(" "))}
            </p>
          )}
        </div>,
      );
      return;
    }

    if (block.startsWith("- ")) {
      const items = block.split("\n").filter((l) => l.startsWith("- "));
      const list = (
        <ul className="space-y-3">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3">
              <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[#067a3f]" />
              <span>{renderInline(item.replace(/^-\s+/, ""))}</span>
            </li>
          ))}
        </ul>
      );
      if (SUMMARY_HEADING.test(section)) {
        out.push(
          <div key={i} className="mt-12 rounded-2xl bg-[#e8f9ee] p-6 sm:p-7">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#01504b]">
              {section}
            </p>
            <div className="mt-4 text-[16px] leading-[1.65] text-[#1f2a28]">{list}</div>
          </div>,
        );
      } else {
        out.push(
          <div key={i} className="mt-5 text-[17px] leading-[1.75] text-[#2f3437]">
            {list}
          </div>,
        );
      }
      return;
    }

    if (/^\d+\.\s/.test(block)) {
      const items = block.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()));
      out.push(
        <ol key={i} className="mt-5 space-y-3 text-[17px] leading-[1.7] text-[#2f3437]">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f9ee] text-[13px] font-bold text-[#01504b]">
                {j + 1}
              </span>
              <span>{renderInline(item.replace(/^\d+\.\s*/, ""))}</span>
            </li>
          ))}
        </ol>,
      );
      return;
    }

    if (MESSAGE_PREFIX.test(block)) {
      const text = block
        .replace(MESSAGE_PREFIX, "")
        .trim()
        .replace(/^["“]|["”]$/g, "");
      out.push(
        <figure key={i} className="mt-5">
          <figcaption className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#5F6368]">
            {messageLabel}
          </figcaption>
          <blockquote className="mt-2 max-w-[560px] rounded-2xl rounded-tl-sm bg-[#dcf8e6] px-4 py-3 text-[16px] leading-[1.6] text-[#14211f]">
            {renderInline(text)}
          </blockquote>
        </figure>,
      );
      return;
    }

    out.push(
      <p key={i} className="mt-5 text-[17px] leading-[1.75] text-[#2f3437] first:mt-0">
        {renderInline(block)}
      </p>,
    );
  });

  return <div>{out}</div>;
}

/** Renders **bold** spans as <strong>; everything else stays plain text (no HTML injection). */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-[#111111]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
