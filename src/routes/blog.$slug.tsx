import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { articles } from "@/data/articles";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const article = articles.find((a) => a.slug === params.slug);
    if (!article) return {};
    return {
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
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    throw notFound();
  }

  return (
    <MarketingLayout>
      <article className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-[640px] px-5 sm:px-8">
          <Reveal>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5F6368] hover:text-[#25D366] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to blog
            </Link>
          </Reveal>

          <Reveal delay={50}>
            <div className="mt-6 flex items-center gap-3">
              <span className="rounded-full bg-[#25D366]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#25D366]">
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#5F6368]">
                <Clock className="size-3" />
                {article.readTime}
              </span>
              <span className="text-[11px] text-[#5F6368]">
                {new Date(article.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-5 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[32px]">
              {article.title}
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <div className="mt-8 space-y-4 text-[15px] leading-[1.8] text-[#5F6368]">
              {article.content.split("\n\n").map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith("## ")) {
                  return (
                    <h2 key={i} className="mt-8 text-[20px] font-bold text-[#111111]">
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }

                if (trimmed.startsWith("- ")) {
                  const items = trimmed.split("\n").filter((l) => l.startsWith("- "));
                  return (
                    <ul key={i} className="mt-3 space-y-2 pl-4">
                      {items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#25D366]" />
                          <span>{item.replace("- ", "")}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (trimmed.startsWith("1. ")) {
                  const items = trimmed.split("\n").filter((l) => /^\d+\./.test(l.trim()));
                  return (
                    <ol key={i} className="mt-3 space-y-2 pl-4">
                      {items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-0.5 text-[13px] font-semibold text-[#25D366]">
                            {j + 1}.
                          </span>
                          <span>{item.replace(/^\d+\.\s*/, "")}</span>
                        </li>
                      ))}
                    </ol>
                  );
                }

                return <p key={i}>{trimmed}</p>;
              })}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-12 rounded-2xl border border-[#E7E9E7] bg-[#F7F8F6] p-6 text-center">
              <p className="text-[15px] font-semibold text-[#111111]">
                Ready to try NANTI?
              </p>
              <p className="mt-1 text-[13px] text-[#5F6368]">
                Start tracking commitments from your WhatsApp conversations.
              </p>
              <Link
                to="/auth/signup"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all hover:bg-[#1fb85c]"
              >
                Get started free
              </Link>
            </div>
          </Reveal>
        </div>
      </article>
    </MarketingLayout>
  );
}
