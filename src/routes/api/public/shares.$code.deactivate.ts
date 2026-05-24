import { createFileRoute } from "@tanstack/react-router";
import { deleteShare } from "@/lib/shares.server";
import { getSupabaseAdmin } from "@/lib/supabase.server";

export const Route = createFileRoute("/api/public/shares/$code/deactivate")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const code = params.code;
        if (!/^\d{4}$/.test(code)) {
          return new Response("Invalid", { status: 400 });
        }
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from("shares")
          .select("id, file_path")
          .eq("code", code)
          .maybeSingle();
        if (data) {
          await deleteShare(data.id, data.file_path);
        }
        return new Response("ok");
      },
    },
  },
});
