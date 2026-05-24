import { createFileRoute } from "@tanstack/react-router";
import { deleteShare, getShareByCode } from "@/lib/shares.server";

export const Route = createFileRoute("/api/public/consume/$code")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const code = params.code;
        if (!/^\d{4}$/.test(code)) {
          return new Response("Invalid", { status: 400 });
        }
        const result = await getShareByCode(code);
        if (result.state === "ok" && result.share.one_time) {
          await deleteShare(result.share.id, result.share.file_path);
        }
        return new Response("ok");
      },
    },
  },
});
