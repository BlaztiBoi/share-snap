import { createFileRoute } from "@tanstack/react-router";
import {
  cleanupExpired,
  deleteShare,
  getShareByCode,
  signedDownloadUrl,
} from "@/lib/shares.server";

export const Route = createFileRoute("/api/public/download/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = params.code;
        if (!/^\d{4}$/.test(code)) {
          return json(400, { error: "Invalid code" });
        }
        await cleanupExpired();
        const result = await getShareByCode(code);
        if (result.state !== "ok") {
          return json(410, { error: "Share unavailable" });
        }
        const { share } = result;
        if (share.kind !== "file" || !share.file_path) {
          return json(400, { error: "Not a file share" });
        }

        const url = await signedDownloadUrl(share.file_path);

        if (share.one_time) {
          // Best-effort: delete after issuing URL
          deleteShare(share.id, share.file_path).catch(() => {});
        }

        return Response.json({
          url,
          fileName: share.file_name,
          fileSize: share.file_size,
          mimeType: share.mime_type,
        });
      },
    },
  },
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
