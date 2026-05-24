import { createFileRoute } from "@tanstack/react-router";
import { cleanupExpired } from "@/lib/shares.server";

export const Route = createFileRoute("/api/public/cron/cleanup")({
  server: {
    handlers: {
      GET: async () => {
        const count = await cleanupExpired();
        return Response.json({ deleted: count });
      },
    },
  },
});
