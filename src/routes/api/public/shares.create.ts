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
  STORAGE_BUCKET,
} from "@/lib/supabase.server";
import { getConfig } from "@/lib/config.server";

const TextSchema = z.object({
  kind: z.literal("text"),
  text: z.string().min(1).max(200_000),
  oneTime: z.boolean().optional().default(false),
});

export const Route = createFileRoute("/api/public/shares/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await cleanupExpired();
          const cfg = await getConfig();
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
              expires_at: await expiryFromNow(),
            });
            if (error) return jsonError(500, error.message);
            return Response.json({ code });
          }

          // Multi-file payload (multipart)
          if (contentType.includes("multipart/form-data")) {
            const form = await request.formData();
            const oneTime = form.get("oneTime") === "true";
            const files = form.getAll("files").filter(
              (f): f is File => f instanceof File,
            );

            if (files.length === 0) {
              return jsonError(400, "No files provided");
            }
            if (files.length > cfg.max_files) {
              return jsonError(
                400,
                `Too many files (max ${cfg.max_files})`,
              );
            }
            const totalSize = files.reduce((s, f) => s + f.size, 0);
            if (totalSize > cfg.max_total_bytes) {
              const mb = (cfg.max_total_bytes / (1024 * 1024)).toFixed(0);
              return jsonError(413, `Total size exceeds ${mb} MB`);
            }
            for (const f of files) {
              if (!isMimeAllowed(f.type)) {
                return jsonError(415, `Unsupported file type: ${f.type}`);
              }
            }

            const code = await generateUniqueCode();

            // Insert parent share first
            const { data: shareRow, error: insErr } = await supabase
              .from("shares")
              .insert({
                code,
                kind: "file",
                one_time: oneTime,
                expires_at: await expiryFromNow(),
              })
              .select("id")
              .single();
            if (insErr || !shareRow) return jsonError(500, insErr?.message ?? "Insert failed");

            const uploadedPaths: string[] = [];
            try {
              const fileRows: Array<{
                share_id: string;
                path: string;
                name: string;
                size: number;
                mime_type: string;
                position: number;
              }> = [];

              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const safeName = file.name.replace(/[^\w.\-]+/g, "_");
                const path = `${code}/${crypto.randomUUID()}-${safeName}`;
                const buf = await file.arrayBuffer();
                const { error: upErr } = await supabase.storage
                  .from(STORAGE_BUCKET)
                  .upload(path, buf, {
                    contentType: file.type || "application/octet-stream",
                    upsert: false,
                  });
                if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
                uploadedPaths.push(path);
                fileRows.push({
                  share_id: shareRow.id,
                  path,
                  name: file.name,
                  size: file.size,
                  mime_type: file.type || "application/octet-stream",
                  position: i,
                });
              }

              const { error: ferr } = await supabase
                .from("share_files")
                .insert(fileRows);
              if (ferr) throw new Error(ferr.message);
            } catch (e) {
              // Roll back: delete uploaded files and the parent row
              if (uploadedPaths.length > 0) {
                await supabase.storage
                  .from(STORAGE_BUCKET)
                  .remove(uploadedPaths);
              }
              await supabase.from("shares").delete().eq("id", shareRow.id);
              const msg = e instanceof Error ? e.message : "Upload error";
              return jsonError(500, msg);
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
