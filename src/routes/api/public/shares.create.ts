import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  cleanupExpired,
  expiryFromNow,
  generateUniqueCode,
} from "@/lib/shares.server";
import {
  getSupabaseAdmin,
  isMimeAllowed,
  MAX_FILE_SIZE,
  STORAGE_BUCKET,
} from "@/lib/supabase.server";

const TextSchema = z.object({
  kind: z.literal("text"),
  text: z.string().min(1).max(100_000),
  oneTime: z.boolean().optional().default(false),
});

export const Route = createFileRoute("/api/public/shares/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await cleanupExpired();
          const supabase = getSupabaseAdmin();
          const contentType = request.headers.get("content-type") ?? "";

          // Text payload
          if (contentType.includes("application/json")) {
            const body = await request.json();
            const parsed = TextSchema.safeParse(body);
            if (!parsed.success) {
              return jsonError(400, "Invalid text payload");
            }
            const code = await generateUniqueCode();
            const { error } = await supabase.from("shares").insert({
              code,
              kind: "text",
              text_content: parsed.data.text,
              one_time: parsed.data.oneTime,
              expires_at: expiryFromNow(),
            });
            if (error) return jsonError(500, error.message);
            return Response.json({ code });
          }

          // File payload (multipart)
          if (contentType.includes("multipart/form-data")) {
            const form = await request.formData();
            const file = form.get("file");
            const oneTime = form.get("oneTime") === "true";

            if (!(file instanceof File)) {
              return jsonError(400, "Missing file");
            }
            if (file.size > MAX_FILE_SIZE) {
              return jsonError(413, "File too large (max 25 MB)");
            }
            if (!isMimeAllowed(file.type)) {
              return jsonError(415, "Unsupported file type");
            }

            const code = await generateUniqueCode();
            const ext = file.name.includes(".")
              ? file.name.substring(file.name.lastIndexOf("."))
              : "";
            const path = `${code}-${crypto.randomUUID()}${ext}`;

            const buffer = await file.arrayBuffer();
            const { error: upErr } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(path, buffer, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
              });
            if (upErr) return jsonError(500, `Upload failed: ${upErr.message}`);

            const { error: insErr } = await supabase.from("shares").insert({
              code,
              kind: "file",
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type || "application/octet-stream",
              one_time: oneTime,
              expires_at: expiryFromNow(),
            });
            if (insErr) {
              await supabase.storage.from(STORAGE_BUCKET).remove([path]);
              return jsonError(500, insErr.message);
            }

            return Response.json({ code });
          }

          return jsonError(400, "Unsupported content-type");
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Server error";
          return jsonError(500, msg);
        }
      },
    },
  },
});

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
