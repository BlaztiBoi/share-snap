import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getConfig, setConfig } from "@/lib/config.server";
import { isAdminRequest } from "@/lib/admin.server";

const PatchSchema = z.object({
  share_ttl_minutes: z.number().int().min(1).max(1440).optional(),
  inactive_seconds: z.number().int().min(5).max(3600).optional(),
  max_total_bytes: z.number().int().min(1024).max(5 * 1024 * 1024 * 1024).optional(),
  max_files: z.number().int().min(1).max(50).optional(),
  admin_password: z.string().min(4).max(200).optional(),
});

export const Route = createFileRoute("/api/public/admin/config")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdminRequest(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const cfg = await getConfig(true);
        return Response.json(cfg);
      },
      PUT: async ({ request }) => {
        if (!(await isAdminRequest(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json().catch(() => ({}));
        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Invalid config", details: parsed.error.flatten() },
            { status: 400 },
          );
        }
        await setConfig(parsed.data);
        const cfg = await getConfig(true);
        return Response.json(cfg);
      },
    },
  },
});
