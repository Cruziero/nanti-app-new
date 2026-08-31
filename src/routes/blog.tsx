import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { MarketingLayout, Reveal } from "@/components/nanti/marketing";
import { articles } from "@/data/articles";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog · NANTI" },
      { name: "description", content: "Updates, tips, and stories from NANTI." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <MarketingLayout>
      <section className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-[800px] px-5 sm:px-8">
          <Reveal>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-4 py-1.5">
              <span className="text-[12px] font-semibold text-[#25D366]">Blog</span>
            </div>
            <h1 className="mt-3 text-[28px] font-bold tracking-tight text-[#111111] sm:text-[36px]">
              Stories & updates
            </h1>
            <p className="mt-3 text-[15px] text-[#5F6368]">
              Tips, product updates, and stories about remembering what matters.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#F7F8F6] py-16 sm:py-20">
        <div className="mx-auto max-w-[800px] px-5 sm:px-8">
          <div className="space-y-6">
            {articles.map((article, i) => (
              <Reveal key={article.slug} delay={i * 80}>
                <Link
                  to={`/blog/$article.slug`}
                  className="group block rounded-2xl border border-[#E7E9E7] bg-white p-6 transition-all hover:border-[#25D366]/30 hover:shadow-[0_4px_14px_rgba(37,211,102,0.1)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-[#25D366]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#25D366]">
                          {article.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#5F6368]">
                          <Clock className="size-3" />
                          {article.readTime}
                        </span>
                      </div>
                      <h2 className="mt-3 text-[17px] font-semibold text-[#111111] group-hover:text-[#25D366] transition-colors">
                        {article.title}
                      </h2>
                      <p className="mt-2 text-[13px] leading-[1.6] text-[#5F6368]">
                        {article.excerpt}
                      </p>
                      <p className="mt-2 text-[11px] text-[#5F6368]">
                        {new Date(article.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <ArrowRight className="mt-4 size-4 shrink-0 text-[#5F6368] group-hover:text-[#25D366] transition-colors" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
