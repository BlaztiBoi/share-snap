import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getConfig } from "@/lib/config.server";

export const Route = createFileRoute("/api/public/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const parsed = z
          .object({ password: z.string().min(1).max(200) })
          .safeParse(body);
        if (!parsed.success) {
          return Response.json({ ok: false }, { status: 400 });
        }
        const cfg = await getConfig(true);
        if (parsed.data.password !== cfg.admin_password) {
          return Response.json({ ok: false }, { status: 401 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
