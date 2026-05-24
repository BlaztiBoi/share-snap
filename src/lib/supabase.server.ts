import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * Never import this from client/component code.
 */
function getSupabaseAdmin() {
  const url = process.env.PRIVATE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey =
    process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing PRIVATE_SUPABASE_URL or PRIVATE_SUPABASE_SERVICE_ROLE_KEY environment variables. See envReadme.md.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { getSupabaseAdmin };

export const STORAGE_BUCKET = "shares";
export const SIGNED_URL_TTL_S = 60;

// Allow-list relaxed: accept everything except executables, which storage
// blocks anyway. Per-share size enforced from app_config.
export const ALLOWED_MIME_PREFIXES = [
  "text/",
  "image/",
  "video/",
  "audio/",
  "application/",
  "font/",
  "model/",
];

export function isMimeAllowed(mime: string): boolean {
  if (!mime) return true;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}
