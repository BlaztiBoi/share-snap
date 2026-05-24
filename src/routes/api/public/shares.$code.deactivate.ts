import { createFileRoute } from "@tanstack/react-router";
import { deleteShareByCode } from "@/lib/shares.server";

export const Route = createFileRoute("/api/public/shares/$code/deactivate")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const code = params.code;
        if (!/^\d{4}$/.test(code)) {
          return new Response("Invalid", { status: 400 });
        }
        await deleteShareByCode(code);
        return new Response("ok");
      },
    },
  },
});
