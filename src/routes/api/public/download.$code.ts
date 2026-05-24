import { createFileRoute } from "@tanstack/react-router";
import {
  cleanupExpired,
  deleteShareById,
  getShareByCode,
  signedDownloadUrl,
} from "@/lib/shares.server";

export const Route = createFileRoute("/api/public/download/$code")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const code = params.code;
        if (!/^\d{4}$/.test(code)) {
          return json(400, { error: "Invalid code" });
        }
        await cleanupExpired();
        const result = await getShareByCode(code);
        if (result.state !== "ok") {
          return json(410, { error: "Share unavailable" });
        }
        const { share, files } = result;
        if (share.kind !== "file" || files.length === 0) {
          return json(400, { error: "Not a file share" });
        }

        const url = new URL(request.url);
        const idxParam = url.searchParams.get("index");
        const fileId = url.searchParams.get("fileId");

        let target = files[0];
        if (fileId) {
          const found = files.find((f) => f.id === fileId);
          if (!found) return json(404, { error: "File not found" });
          target = found;
        } else if (idxParam) {
          const i = parseInt(idxParam, 10);
          if (Number.isNaN(i) || i < 0 || i >= files.length) {
            return json(400, { error: "Invalid index" });
          }
          target = files[i];
        }

        const signed = await signedDownloadUrl(target.path);

        // Only consume on one-time when ALL files have been requested.
        // Receiver fires deleteAfterAll explicitly when last file downloaded.

        return Response.json({
          url: signed,
          fileName: target.name,
          fileSize: target.size,
          mimeType: target.mime_type,
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
