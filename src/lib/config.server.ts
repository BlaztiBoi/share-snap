import { getSupabaseAdmin } from "./supabase.server";

export type AppConfig = {
  share_ttl_minutes: number;
  inactive_seconds: number;
  max_total_bytes: number;
  max_files: number;
  admin_password: string;
};

const DEFAULTS: AppConfig = {
  share_ttl_minutes: 30,
  inactive_seconds: 60,
  max_total_bytes: 100 * 1024 * 1024,
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
  cache = { value: merged, expires: Date.now() + TTL_MS };
  return merged;
}

export async function setConfig(patch: Partial<AppConfig>) {
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
