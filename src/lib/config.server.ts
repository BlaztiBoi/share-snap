import { getSupabaseAdmin } from "./supabase.server";

export type AppConfig = {
  share_ttl_minutes: number;
  inactive_seconds: number;
  max_total_bytes: number;
  max_files: number;
  admin_password: string;
};

/** Vercel Functions cap request bodies at 4.5 MB — stay under that for multipart uploads. */
export const VERCEL_MAX_TOTAL_BYTES = 4 * 1024 * 1024;

const DEFAULTS: AppConfig = {
  share_ttl_minutes: 30,
  inactive_seconds: 60,
  max_total_bytes: process.env.VERCEL
    ? VERCEL_MAX_TOTAL_BYTES
    : 100 * 1024 * 1024,
  max_files: 10,
  admin_password: "admin123",
};

let cache: { value: AppConfig; expires: number } | null = null;
const TTL_MS = 5_000;

export async function getConfig(force = false): Promise<AppConfig> {
  if (!force && cache && cache.expires > Date.now()) return cache.value;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("app_config").select("key, value");
  const merged: AppConfig = { ...DEFAULTS };
  for (const row of data ?? []) {
    const k = row.key as keyof AppConfig;
    if (k in merged) (merged as any)[k] = row.value;
  }
  if (process.env.VERCEL) {
    merged.max_total_bytes = Math.min(
      merged.max_total_bytes,
      VERCEL_MAX_TOTAL_BYTES,
    );
  }
  cache = { value: merged, expires: Date.now() + TTL_MS };
  return merged;
}

export async function setConfig(patch: Partial<AppConfig>) {
  if (process.env.VERCEL && patch.max_total_bytes != null) {
    patch.max_total_bytes = Math.min(patch.max_total_bytes, VERCEL_MAX_TOTAL_BYTES);
  }
  const supabase = getSupabaseAdmin();
  const rows = Object.entries(patch).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("app_config")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
  cache = null;
}

export function invalidateConfig() {
  cache = null;
}
