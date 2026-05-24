import { createFileRoute } from "@tanstack/react-router";
import { cleanupExpired, getShareByCode } from "@/lib/shares.server";

export const Route = createFileRoute("/api/public/shares/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = params.code;
        if (!/^\d{4}$/.test(code)) {
          return json(400, { error: "Invalid code" });
        }
        await cleanupExpired();
        const result = await getShareByCode(code);

        if (result.state === "not_found") {
          return json(404, { error: "Share not found" });
        }
        if (result.state === "expired") {
          return json(410, { error: "Share has expired" });
        }
        if (result.state === "inactive") {
          return json(410, { error: "Sender is no longer connected" });
        }

        const { share } = result;
        return Response.json({
          kind: share.kind,
          text: share.kind === "text" ? share.text_content : null,
          fileName: share.file_name,
          fileSize: share.file_size,
          mimeType: share.mime_type,
          oneTime: share.one_time,
          expiresAt: share.expires_at,
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
