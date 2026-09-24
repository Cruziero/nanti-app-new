import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadPersonalAiContext(context: { supabase: any; userId: string }) {
  const [{ loadLanguageLearningPrompt }, { loadEntityRoutinePrompt }] = await Promise.all([
    import("./nanti-learning.functions"),
    import("./nanti-context-memory.functions"),
  ]);
  const [language, entities] = await Promise.all([
    loadLanguageLearningPrompt(context.supabase, context.userId),
    loadEntityRoutinePrompt(context.supabase, context.userId),
  ]);
  return [language, entities].filter(Boolean).join("\n\n");
}

async function consumeAiQuota(
  context: { supabase: any; userId: string },
  kind: "text" | "screenshot",
) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const eventName = kind === "screenshot" ? "ai_screenshot_request" : "ai_request";

  const { count: totalCount, error: totalError } = await context.supabase
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.userId)
    .in("event_name", ["ai_request", "ai_screenshot_request"])
    .gte("created_at", cutoff);

  if (totalError) {
    console.error("AI quota lookup failed:", totalError);
    throw new Error("AI usage check failed. Please try again.");
  }
  if ((totalCount || 0) >= 90) {
    throw new Error("AI request limit reached. Please try again later.");
  }

  if (kind === "screenshot") {
    const { count: screenshotCount, error: screenshotError } = await context.supabase
      .from("product_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("event_name", "ai_screenshot_request")
      .gte("created_at", cutoff);

    if (screenshotError) {
      console.error("Screenshot quota lookup failed:", screenshotError);
      throw new Error("AI usage check failed. Please try again.");
    }
    if ((screenshotCount || 0) >= 15) {
      throw new Error("Screenshot analysis limit reached. Please try again later.");
    }
  }

  const { error: insertError } = await context.supabase.from("product_events").insert({
    user_id: context.userId,
    event_name: eventName,
    source: "web",
    properties: { kind },
  });
  if (insertError) {
    console.error("AI quota event write failed:", insertError);
    throw new Error("AI usage check failed. Please try again.");
  }
}

export const analyzeConversation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        text: z.string().min(1).max(20000),
        source: z.string().max(120).optional(),
        context: z.string().max(16000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await consumeAiQuota(context, "text");
    const [{ extractItems }, personalContext] = await Promise.all([
      import("./nanti-ai.server"),
      loadPersonalAiContext(context),
    ]);
    const combinedContext = [data.context, personalContext].filter(Boolean).join("\n\n");
    return extractItems(data.text, data.source, combinedContext);
  });

export const analyzeScreenshot = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        image: z.string().min(32).max(8_000_000).startsWith("data:image/"),
        source: z.string().max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await consumeAiQuota(context, "screenshot");
    const [{ extractFromImage }, personalContext] = await Promise.all([
      import("./nanti-ai.server"),
      loadPersonalAiContext(context),
    ]);
    return extractFromImage(data.image, data.source, personalContext);
  });

export const askAssistant = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ question: z.string().min(1).max(2000), context: z.string().max(20000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await consumeAiQuota(context, "text");
    const [{ askNanti }, personalContext] = await Promise.all([
      import("./nanti-ai.server"),
      loadPersonalAiContext(context),
    ]);
    return {
      answer: await askNanti(
        data.question,
        [data.context, personalContext].filter(Boolean).join("\n\n"),
      ),
    };
  });


export const interpretTaskCommand = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      message: z.string().min(1).max(2000),
      items: z.array(
        z.object({
          id: z.string().min(1).max(120),
          title: z.string().max(500),
          kind: z.string().max(40),
          status: z.string().max(40),
          due: z.string().optional(),
          time: z.string().optional(),
          person: z.string().max(200).optional(),
          project: z.string().max(200).optional(),
          updatedAt: z.string().optional(),
        }),
      ).max(25),
      recentConversation: z.string().max(8000).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await consumeAiQuota(context, "text");
    const [{ interpretAssistantCommand }, personalContext] = await Promise.all([
      import("./nanti-ai.server"),
      loadPersonalAiContext(context),
    ]);
    return interpretAssistantCommand(
      data.message,
      data.items,
      [data.recentConversation, personalContext].filter(Boolean).join("\n\n"),
    );
  });

export const parseSmartDateServer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ text: z.string().min(1).max(500) }).parse(data))
  .handler(async ({ data }) => {
    const { parseSmartDate } = await import("./nanti-dates");
    return parseSmartDate(data.text);
  });

export const generateFollowUpMessageServer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        personName: z.string(),
        what: z.string(),
        tone: z.enum(["formal", "professional", "casual", "friendly", "warm", "direct"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { generateFollowUpMessage } = await import("./nanti-followup");
    return {
      message: generateFollowUpMessage(
        {
          itemId: "",
          type: "waiting_no_response",
          title: data.what,
          personName: data.personName,
          daysSince: 0,
          suggestedAction: "",
        },
        data.tone,
      ),
    };
  });


export const processAssistantTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      message: z.string().min(1).max(4000),
      workspaceContext: z.string().max(24000).optional().default(""),
      recentConversation: z.string().max(10000).optional().default(""),
      items: z.array(
        z.object({
          id: z.string().min(1).max(120),
          title: z.string().max(500),
          kind: z.string().max(40),
          status: z.string().max(40),
          due: z.string().optional(),
          time: z.string().optional(),
          person: z.string().max(200).optional(),
          project: z.string().max(200).optional(),
          semantic: z.unknown().optional(),
        }),
      ).max(40),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await consumeAiQuota(context, "text");
    const [{ runAssistantTurn }, { normalizeCasualIndonesian }, personalContext] =
      await Promise.all([
        import("./nanti-ai.server"),
        import("./nanti-language"),
        loadPersonalAiContext(context),
      ]);

    return runAssistantTurn({
      rawMessage: data.message,
      normalizedMessage: normalizeCasualIndonesian(data.message),
      workspaceContext: [data.workspaceContext, personalContext]
        .filter(Boolean)
        .join("\n\n"),
      itemContext: data.items,
      recentConversation: data.recentConversation,
    });
  });
