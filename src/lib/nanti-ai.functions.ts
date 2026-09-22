import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const analyzeConversation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ text: z.string().min(1).max(20000), source: z.string().max(120).optional() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { extractItems } = await import("./nanti-ai.server");
    return extractItems(data.text, data.source);
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
  .handler(async ({ data }) => {
    const { extractFromImage } = await import("./nanti-ai.server");
    return extractFromImage(data.image, data.source);
  });

export const askAssistant = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ question: z.string().min(1).max(2000), context: z.string().max(20000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { askNanti } = await import("./nanti-ai.server");
    return { answer: await askNanti(data.question, data.context) };
  });


export const interpretTaskCommand = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      message: z.string().min(1).max(2000),
      items: z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string().max(500),
          kind: z.string().max(40),
          status: z.string().max(40),
          due: z.string().optional(),
          time: z.string().optional(),
          person: z.string().max(200).optional(),
          updatedAt: z.string().optional(),
        }),
      ).max(25),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const { interpretAssistantCommand } = await import("./nanti-ai.server");
    return interpretAssistantCommand(data.message, data.items);
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
