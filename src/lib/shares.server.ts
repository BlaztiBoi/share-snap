import {
  getSupabaseAdmin,
  INACTIVE_AFTER_MS,
  SHARE_TTL_MS,
  SIGNED_URL_TTL_S,
  STORAGE_BUCKET,
} from "./supabase.server";

export type ShareRow = {
  id: string;
  code: string;
  kind: "text" | "file";
  text_content: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  one_time: boolean;
  active: boolean;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
};

export function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function generateUniqueCode(): Promise<string> {
  const supabase = getSupabaseAdmin();
  for (let i = 0; i < 12; i++) {
    const code = generateCode();
    const { data } = await supabase
      .from("shares")
      .select("id")
      .eq("code", code)
      .eq("active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Failed to generate unique code. Please try again.");
}

/** Lazy cleanup: delete expired or long-inactive shares + their files */
export async function cleanupExpired(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const staleCutoff = new Date(Date.now() - INACTIVE_AFTER_MS).toISOString();

  const { data: stale } = await supabase
    .from("shares")
    .select("id, file_path")
    .or(`expires_at.lt.${now},last_seen_at.lt.${staleCutoff}`);

  if (!stale || stale.length === 0) return 0;

  const filePaths = stale
    .map((r) => r.file_path)
    .filter((p): p is string => !!p);

  if (filePaths.length > 0) {
    await supabase.storage.from(STORAGE_BUCKET).remove(filePaths);
  }

  const ids = stale.map((r) => r.id);
  await supabase.from("shares").delete().in("id", ids);

  return stale.length;
}

export async function deleteShare(id: string, filePath: string | null) {
  const supabase = getSupabaseAdmin();
  if (filePath) {
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
  }
  await supabase.from("shares").delete().eq("id", id);
}

export type ShareStatus =
  | { state: "ok"; share: ShareRow }
  | { state: "not_found" }
  | { state: "expired" }
  | { state: "inactive" };

export async function getShareByCode(code: string): Promise<ShareStatus> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shares")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return { state: "not_found" };

  const share = data as ShareRow;
  const now = Date.now();
  if (new Date(share.expires_at).getTime() < now) return { state: "expired" };
  if (!share.active) return { state: "inactive" };
  if (now - new Date(share.last_seen_at).getTime() > INACTIVE_AFTER_MS) {
    return { state: "inactive" };
  }
  return { state: "ok", share };
}

export function expiryFromNow() {
  return new Date(Date.now() + SHARE_TTL_MS).toISOString();
}

export async function signedDownloadUrl(filePath: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_S, { download: true });
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Failed to create signed URL");
  }
  return data.signedUrl;
}
