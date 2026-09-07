import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  read_time: string;
  ai_generated: boolean;
  published: boolean;
}

function getAdminClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Supabase credentials not configured");
  return createClient(url, key);
}

export const fetchPublishedArticles = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("published", true)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogArticle[];
    } catch {
      return null;
    }
  },
);

export const fetchArticleBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();
      if (error) throw error;
      return data as BlogArticle | null;
    } catch {
      return null;
    }
  });

export const countPublishedArticles = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const supabase = getAdminClient();
      const { count, error } = await supabase
        .from("blog_articles")
        .select("*", { count: "exact", head: true })
        .eq("published", true);
      if (error) throw error;
      return count ?? 0;
    } catch {
      return 0;
    }
  },
);
