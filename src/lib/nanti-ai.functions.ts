import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const analyzeConversation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ text: z.string().min(1).max(20000), source: z.string().max(120).optional() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { extractItems } = await import("./nanti-ai.server");
    return extractItems(data.text, data.source);
  });

export const analyzeScreenshot = createServerFn({ method: "POST" })
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

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ question: z.string().min(1).max(2000), context: z.string().max(20000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { askNanti } = await import("./nanti-ai.server");
    return { answer: await askNanti(data.question, data.context) };
  });
