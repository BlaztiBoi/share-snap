import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase.server";

export const Route = createFileRoute("/api/public/shares/$code/heartbeat")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const code = params.code;
        if (!/^\d{4}$/.test(code)) {
          return new Response("Invalid", { status: 400 });
        }
        const supabase = getSupabaseAdmin();
        await supabase
          .from("shares")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("code", code)
          .eq("active", true);
        return new Response("ok");
      },
    },
  },
});
