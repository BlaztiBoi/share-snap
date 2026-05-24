import { createFileRoute } from "@tanstack/react-router";
import { isAdminRequest } from "@/lib/admin.server";
import { getSupabaseAdmin } from "@/lib/supabase.server";
import { deleteShareById } from "@/lib/shares.server";

export const Route = createFileRoute("/api/public/admin/shares")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdminRequest(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const supabase = getSupabaseAdmin();
        const { data: shares } = await supabase
          .from("shares")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        const ids = (shares ?? []).map((s) => s.id);
        const { data: files } = ids.length
          ? await supabase
              .from("share_files")
              .select("share_id, id, name, size, mime_type")
              .in("share_id", ids)
          : { data: [] };

        const byShare = new Map<string, any[]>();
        for (const f of files ?? []) {
          const arr = byShare.get(f.share_id) ?? [];
          arr.push(f);
          byShare.set(f.share_id, arr);
        }

        return Response.json({
          shares: (shares ?? []).map((s) => ({
            id: s.id,
            code: s.code,
            kind: s.kind,
            oneTime: s.one_time,
            active: s.active,
            createdAt: s.created_at,
            expiresAt: s.expires_at,
            lastSeenAt: s.last_seen_at,
            textPreview:
              s.kind === "text" && s.text_content
                ? String(s.text_content).slice(0, 120)
                : null,
            files: byShare.get(s.id) ?? [],
            // Back-compat legacy single
            legacyFile: s.file_path
              ? { name: s.file_name, size: s.file_size, mime: s.mime_type }
              : null,
          })),
        });
      },
      DELETE: async ({ request }) => {
        if (!(await isAdminRequest(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json().catch(() => ({}));
        const id = body?.id as string | undefined;
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
        await deleteShareById(id);
        return Response.json({ ok: true });
      },
    },
  },
});
