import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * Never import this from client/component code.
 */
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. See envReadme.md.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { getSupabaseAdmin };

export const STORAGE_BUCKET = "shares";
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const SHARE_TTL_MS = 30 * 60 * 1000; // 30 min
export const INACTIVE_AFTER_MS = 60 * 1000; // 60 s
export const SIGNED_URL_TTL_S = 60;

export const ALLOWED_MIME_PREFIXES = [
  "text/",
  "image/",
  "video/",
  "audio/",
];
export const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "application/json",
]);

export function isMimeAllowed(mime: string): boolean {
  if (!mime) return true; // generic
  if (ALLOWED_MIME_EXACT.has(mime)) return true;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}
