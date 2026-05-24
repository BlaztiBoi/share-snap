import { getConfig } from "./config.server";

export async function isAdminRequest(request: Request): Promise<boolean> {
  const provided = request.headers.get("x-admin-password");
  if (!provided) return false;
  const cfg = await getConfig();
  // Timing-safe-ish compare
  if (provided.length !== cfg.admin_password.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ cfg.admin_password.charCodeAt(i);
  }
  return diff === 0;
}
