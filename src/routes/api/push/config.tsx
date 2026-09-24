import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/push/config")({
  server: {
    handlers: {
      GET: async () => {
        const publicKey =
          process.env.VAPID_PUBLIC_KEY ||
          process.env.VITE_VAPID_PUBLIC_KEY ||
          "";
        return new Response(
          JSON.stringify({
            configured: Boolean(publicKey && process.env.VAPID_PRIVATE_KEY),
            publicKey: publicKey || null,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "private, max-age=300",
            },
          },
        );
      },
    },
  },
});
