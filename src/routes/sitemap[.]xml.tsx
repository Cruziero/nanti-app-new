import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

const STATIC_PATHS: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/how-it-works", priority: "0.8", changefreq: "monthly" },
  { path: "/pricing", priority: "0.8", changefreq: "monthly" },
  { path: "/personal", priority: "0.6", changefreq: "monthly" },
  { path: "/business", priority: "0.6", changefreq: "monthly" },
  { path: "/about", priority: "0.5", changefreq: "yearly" },
  { path: "/help", priority: "0.5", changefreq: "monthly" },
  { path: "/careers", priority: "0.4", changefreq: "yearly" },
  { path: "/affiliates", priority: "0.4", changefreq: "monthly" },
  { path: "/legal/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/legal/privacy", priority: "0.3", changefreq: "yearly" },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, options?: { lastmod?: string; changefreq?: string; priority?: string }) {
  const parts = [`    <loc>${escapeXml(loc)}</loc>`];
  if (options?.lastmod) parts.push(`    <lastmod>${escapeXml(options.lastmod)}</lastmod>`);
  if (options?.changefreq) parts.push(`    <changefreq>${options.changefreq}</changefreq>`);
  if (options?.priority) parts.push(`    <priority>${options.priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

async function fetchBlogSlugs(): Promise<Array<{ slug: string; date: string }>> {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("blog_articles")
      .select("slug, date")
      .eq("published", true)
      .order("date", { ascending: false });
    if (error) return [];
    return (data ?? []).filter((row) => row.slug) as Array<{ slug: string; date: string }>;
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = STATIC_PATHS.map((entry) =>
          urlEntry(`${SITE_URL}${entry.path}`, {
            changefreq: entry.changefreq,
            priority: entry.priority,
          }),
        );

        for (const article of await fetchBlogSlugs()) {
          const lastmod = article.date ? String(article.date).slice(0, 10) : undefined;
          entries.push(
            urlEntry(`${SITE_URL}/blog/${encodeURIComponent(article.slug)}`, {
              lastmod,
              changefreq: "monthly",
              priority: "0.7",
            }),
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          status: 200,
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
