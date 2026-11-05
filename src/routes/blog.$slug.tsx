import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { articles as staticArticles } from "@/data/articles";
import { fetchArticleBySlug, type BlogArticle } from "@/lib/nanti-blog";
import { canonical, SITE_URL } from "@/lib/site";
import { articleLang, extractFaq } from "@/lib/nanti-articles";

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
              };
            }
          | undefined
      )?.article ??
      staticArticles.find((a) => a.slug === params.slug) ??
      null;
    if (!article) return {};
    const url = `${SITE_URL}/blog/${params.slug}`;
    const faq = extractFaq(article.content);
    const structured: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.excerpt,
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

function ArticlePage() {
  const { article } = Route.useLoaderData();

  const title = (article as BlogArticle).title ?? article.title;
  const category = (article as BlogArticle).category ?? article.category;
  const readTime = (article as BlogArticle).read_time ?? article.readTime;
  const date = (article as BlogArticle).date ?? article.date;
  const content = (article as BlogArticle).content ?? article.content;
  const excerpt = (article as BlogArticle).excerpt ?? article.excerpt;

  return (
    <MarketingLayout>
      <article className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-[640px] px-5 sm:px-8">
          <Reveal>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5F6368] hover:text-[#067a3f] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to blog
            </Link>
          </Reveal>

          <Reveal delay={50}>
            <div className="mt-6 flex items-center gap-3">
              <span className="rounded-full bg-[#067a3f]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#067a3f]">
                {category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#5F6368]">
                <Clock className="size-3" />
                {readTime}
              </span>
              <span className="text-[11px] text-[#5F6368]">
                {new Date(date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-5 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[32px]">
              {title}
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <div className="mt-8 space-y-4 text-[15px] leading-[1.8] text-[#5F6368]">
              {content.split("\n\n").map((block: string, i: number) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith("### ")) {
                  // FAQ items often arrive as "### question" with the answer on the next line.
                  const [heading, ...rest] = trimmed.split("\n");
                  return (
                    <div key={i}>
                      <h3 className="mt-6 text-[17px] font-semibold text-[#111111]">
                        {heading!.replace("### ", "")}
                      </h3>
                      {rest.length > 0 && <p className="mt-2">{renderInline(rest.join(" "))}</p>}
                    </div>
                  );
                }

                if (trimmed.startsWith("## ")) {
                  return (
                    <h2 key={i} className="mt-8 text-[20px] font-bold text-[#111111]">
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }

                if (trimmed.startsWith("- ")) {
                  const items = trimmed.split("\n").filter((l: string) => l.startsWith("- "));
                  return (
                    <ul key={i} className="mt-3 space-y-2 pl-4">
                      {items.map((item: string, j: number) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#067a3f]" />
                          <span>{renderInline(item.replace("- ", ""))}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (trimmed.startsWith("1. ")) {
                  const items = trimmed.split("\n").filter((l: string) => /^\d+\./.test(l.trim()));
                  return (
                    <ol key={i} className="mt-3 space-y-2 pl-4">
                      {items.map((item: string, j: number) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-0.5 text-[13px] font-semibold text-[#067a3f]">
                            {j + 1}.
                          </span>
                          <span>{renderInline(item.replace(/^\d+\.\s*/, ""))}</span>
                        </li>
                      ))}
                    </ol>
                  );
                }

                return <p key={i}>{renderInline(trimmed)}</p>;
              })}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-12 rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-6 text-center">
              <p className="text-[15px] font-semibold text-[#111111]">Ready to try NANTI?</p>
              <p className="mt-1 text-[13px] text-[#5F6368]">
                Start tracking commitments from your WhatsApp conversations.
              </p>
              <Link
                to="/welcome"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#067a3f] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(6,122,63,0.3)] transition-all hover:bg-[#056434]"
              >
                Try NANTI for free
              </Link>
            </div>
          </Reveal>
        </div>
      </article>
    </MarketingLayout>
  );
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
