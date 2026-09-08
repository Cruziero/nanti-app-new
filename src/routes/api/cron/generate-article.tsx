import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-3.5-flash";

const ARTICLE_TOPICS = [
  {
    title: "Why Your Brain Can't Keep Up with WhatsApp (And What to Do About It)",
    category: "Productivity",
    angle: "Cognitive overload from constant messaging; how AI offloads memory burden",
  },
  {
    title: "The Hidden Cost of Forgotten Promises in Business",
    category: "Business",
    angle: "Lost revenue, damaged trust, missed deadlines from untracked commitments",
  },
  {
    title: "How AI is Changing the Way We Remember Conversations",
    category: "Technology",
    angle: "Natural language processing, commitment extraction, the future of conversational AI",
  },
  {
    title: "5 Signs You're Dropping the Ball on WhatsApp Commitments",
    category: "Personal",
    angle: "Relatable scenarios of missed promises and how to recognize the pattern",
  },
  {
    title: "From Chaos to Clarity: Organizing Your WhatsApp Commitments",
    category: "Tutorial",
    angle: "Step-by-step system for turning messy chats into tracked action items",
  },
  {
    title: "What Your WhatsApp Chats Say About Your Follow-Up Habits",
    category: "Insights",
    angle: "Patterns in messaging behavior, common pitfalls, data-driven observations",
  },
  {
    title: "How Freelancers Can Never Miss a Client Deadline Again",
    category: "Business",
    angle: "Freelancer-specific challenges with client communication and deadline tracking",
  },
  {
    title: "The Science Behind Forgetting: Why We Lose Track of Conversations",
    category: "Research",
    angle: "Psychology of memory, Ebbinghaus curve, why digital memory augmentation works",
  },
  {
    title: "Managing Family Commitments Without the Mental Load",
    category: "Personal",
    angle: "Family coordination, shared responsibilities, reducing mental burden for parents",
  },
  {
    title: "How AI Extracts Commitments from Messy Chat Logs",
    category: "Technology",
    angle: "Under the hood of NANTI's extraction engine, NLP techniques, practical examples",
  },
  {
    title: "Stop Losing Supplier Promises: A Guide for Importers",
    category: "Business",
    angle: "Supply chain communication, tracking delivery promises, avoiding costly delays",
  },
  {
    title: "WhatsApp vs. Telegram vs. iMessage: Which is Best for Tracking Commitments?",
    category: "Comparison",
    angle: "Platform comparison for business communication and commitment tracking",
  },
  {
    title: "The Minimalist's Guide to Digital Commitment Tracking",
    category: "Productivity",
    angle: "Less is more — how to track only what matters without app fatigue",
  },
  {
    title: "How to Follow Up Without Being Annoying",
    category: "Communication",
    angle: "Follow-up etiquette, timing strategies, how AI helps you follow up at the right time",
  },
  {
    title: "Building Trust Through Reliable Follow-Through",
    category: "Personal",
    angle: "How keeping promises builds relationships, professional and personal",
  },
  {
    title: "Why Traditional To-Do Lists Fail for WhatsApp Conversations",
    category: "Productivity",
    angle: "Context loss in to-do lists, why conversational extraction is superior",
  },
  {
    title: "How Small Teams Stay Accountable with AI Memory",
    category: "Business",
    angle: "Team coordination, shared commitments, accountability without micromanagement",
  },
  {
    title: "The Future of Conversational Intelligence",
    category: "Technology",
    angle: "Where AI-powered conversation analysis is heading, emerging capabilities",
  },
  {
    title: "Turning WhatsApp Group Chats into Action Items",
    category: "Tutorial",
    angle: "How to handle group conversations, multiple commitments, different participants",
  },
  {
    title: "Real Stories: How NANTI Users Never Miss a Deadline",
    category: "Case Study",
    angle: "User stories, before/after scenarios, practical benefits of AI memory",
  },
];

function getTopicForDate(date: Date): (typeof ARTICLE_TOPICS)[number] {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return ARTICLE_TOPICS[dayOfYear % ARTICLE_TOPICS.length];
}

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(2, Math.round(words / 200));
  return `${minutes} min`;
}

async function generateArticle(topic: (typeof ARTICLE_TOPICS)[number]) {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY not configured");

  const prompt = `You are a blog writer for NANTI, an AI-powered WhatsApp memory app that extracts commitments, reminders, and follow-ups from conversations.

Write a blog article with the following:
- Title: ${topic.title}
- Category: ${topic.category}
- Angle: ${topic.angle}

Requirements:
- Write in English
- Use markdown formatting (## for headings, ** for bold, - for lists, 1. for numbered lists)
- 400-600 words
- SEO-friendly: use the title as H2, include the category keyword naturally
- Conversational, approachable tone
- Include a brief introduction that hooks the reader
- Include a call-to-action at the end mentioning NANTI
- Do NOT include the title as a markdown heading (it will be added separately)
- Start directly with content, no preamble

Return ONLY a JSON object with this structure:
{
  "title": "the full title",
  "excerpt": "a 1-2 sentence summary for SEO meta description",
  "content": "the full markdown content",
  "category": "${topic.category}"
}`;

  const res = await fetch(`${GEMINI_API_URL}/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  
  // Try to extract JSON from the response, handling code blocks
  let jsonStr = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }
  
  // Try parsing the cleaned string first, then fall back to regex
  try {
    return JSON.parse(jsonStr.trim()) as {
      title: string;
      excerpt: string;
      content: string;
      category: string;
    };
  } catch {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Failed to parse AI response. Raw: ${text.slice(0, 500)}`);
    return JSON.parse(jsonMatch[0]) as {
      title: string;
      excerpt: string;
      content: string;
      category: string;
    };
  }
}

export const Route = createFileRoute("/api/cron/generate-article")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const cronSecret = process.env.CRON_SECRET;
          if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );

          const now = new Date();
          const jakartaTime = new Date(
            now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
          );
          const today = jakartaTime.toISOString().slice(0, 10);

          const { data: existing } = await supabase
            .from("blog_articles")
            .select("id")
            .eq("date", today)
            .limit(1);

          if (existing && existing.length > 0) {
            return new Response(
              JSON.stringify({ skipped: true, reason: "Article already exists for today" }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          const topic = getTopicForDate(jakartaTime);
          const article = await generateArticle(topic);
          const slug = makeSlug(article.title);

          const { data: slugExists } = await supabase
            .from("blog_articles")
            .select("id")
            .eq("slug", slug)
            .limit(1);

          if (slugExists && slugExists.length > 0) {
            return new Response(
              JSON.stringify({ skipped: true, reason: "Slug already exists" }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          const { error: insertError } = await supabase.from("blog_articles").insert({
            slug,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category,
            date: today,
            read_time: estimateReadTime(article.content),
            ai_generated: true,
            published: true,
          });

          if (insertError) throw insertError;

          return new Response(
            JSON.stringify({
              ok: true,
              slug,
              title: article.title,
              date: today,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          console.error("Article generation error:", error);
          return new Response(
            JSON.stringify({ error: "Internal error", message: String(error) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
