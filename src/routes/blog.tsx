import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";
import { BookOpen } from "lucide-react";

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
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Blog</p>
        <h1 className="display-lg mt-5 text-foreground">Stories & updates</h1>

        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface border border-border">
            <BookOpen className="size-7 text-muted-foreground" />
          </div>
          <p className="mt-6 text-[18px] font-semibold">Nothing published yet</p>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Check back soon — we&apos;ll share tips, product updates, and stories here.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
