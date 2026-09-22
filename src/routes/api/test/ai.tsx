import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test/ai")({
  server: { handlers: { GET: () => new Response("Not found", { status: 404 }) } },
});
