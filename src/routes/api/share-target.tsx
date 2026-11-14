import { createFileRoute } from "@tanstack/react-router";

// Reached only when the service worker is not in control yet.
// The shared payload is lost here, so land on the import page instead of an error.
function toImport(request: Request) {
  return Response.redirect(new URL("/app/import", request.url).toString(), 303);
}

export const Route = createFileRoute("/api/share-target")({
  server: {
    handlers: {
      GET: async ({ request }) => toImport(request),
      POST: async ({ request }) => toImport(request),
    },
  },
});
