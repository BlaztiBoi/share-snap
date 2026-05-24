import {
  getSupabaseAdmin,
  SIGNED_URL_TTL_S,
  STORAGE_BUCKET,
} from "./supabase.server";
import { getConfig } from "./config.server";

export type ShareRow = {
  id: string;
  code: string;
  kind: "text" | "file";
  text_content: string | null;
  // Legacy single-file columns (kept for backwards compat, unused for new rows)
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

export type ShareFile = {
  id: string;
  share_id: string;
  path: string;
  name: string;
  size: number;
  mime_type: string | null;
  position: number;
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
  const cfg = await getConfig();
  const now = new Date().toISOString();
  const staleCutoff = new Date(
    Date.now() - cfg.inactive_seconds * 1000,
  ).toISOString();

  const { data: stale } = await supabase
    .from("shares")
    .select("id, file_path")
    .or(`expires_at.lt.${now},last_seen_at.lt.${staleCutoff}`);

  if (!stale || stale.length === 0) return 0;
  const ids = stale.map((r) => r.id);

  // Collect every file path (legacy single + share_files multi)
  const paths: string[] = stale
    .map((r) => r.file_path)
    .filter((p): p is string => !!p);
  const { data: extraFiles } = await supabase
    .from("share_files")
    .select("path")
    .in("share_id", ids);
  for (const f of extraFiles ?? []) paths.push(f.path);

  if (paths.length > 0) {
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  }

  await supabase.from("shares").delete().in("id", ids);
  return stale.length;
}

export async function deleteShareById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data: share } = await supabase
    .from("shares")
    .select("id, file_path")
    .eq("id", id)
    .maybeSingle();
  if (!share) return;
  const paths: string[] = share.file_path ? [share.file_path] : [];
  const { data: extra } = await supabase
    .from("share_files")
    .select("path")
    .eq("share_id", id);
  for (const f of extra ?? []) paths.push(f.path);
  if (paths.length > 0) {
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  }
  await supabase.from("shares").delete().eq("id", id);
}

export async function deleteShareByCode(code: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("shares")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (data) await deleteShareById(data.id);
}

export type ShareStatus =
  | { state: "ok"; share: ShareRow; files: ShareFile[] }
  | { state: "not_found" }
  | { state: "expired" }
  | { state: "inactive" };

export async function getShareByCode(code: string): Promise<ShareStatus> {
  const supabase = getSupabaseAdmin();
  const cfg = await getConfig();
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
  if (now - new Date(share.last_seen_at).getTime() > cfg.inactive_seconds * 1000) {
    return { state: "inactive" };
  }

  let files: ShareFile[] = [];
  if (share.kind === "file") {
    const { data: rows } = await supabase
      .from("share_files")
      .select("*")
      .eq("share_id", share.id)
      .order("position", { ascending: true });
    files = (rows ?? []) as ShareFile[];
    // Backwards compat: if no share_files rows but legacy single-file columns are set
    if (files.length === 0 && share.file_path) {
      files = [
        {
          id: share.id,
          share_id: share.id,
          path: share.file_path,
          name: share.file_name ?? "download",
          size: share.file_size ?? 0,
          mime_type: share.mime_type,
          position: 0,
        },
      ];
    }
  }
  return { state: "ok", share, files };
}

export async function expiryFromNow() {
  const cfg = await getConfig();
  return new Date(Date.now() + cfg.share_ttl_minutes * 60 * 1000).toISOString();
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
