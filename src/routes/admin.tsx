import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, LogOut, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Blazt Share" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const PW_KEY = "blazt_admin_pw";

type Cfg = {
  share_ttl_minutes: number;
  inactive_seconds: number;
  max_total_bytes: number;
  max_files: number;
  admin_password: string;
};

type ShareItem = {
  id: string;
  code: string;
  kind: "text" | "file";
  oneTime: boolean;
  active: boolean;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
  textPreview: string | null;
  files: { id: string; name: string; size: number; mime_type: string | null }[];
  legacyFile: { name: string; size: number; mime: string } | null;
};

function AdminPage() {
  const [pw, setPw] = useState<string | null>(null);
  const [pwInput, setPwInput] = useState("");
  const [authing, setAuthing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPw(localStorage.getItem(PW_KEY));
    }
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthing(true);
    try {
      const res = await fetch("/api/public/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pwInput }),
      });
      if (!res.ok) {
        toast.error("Wrong password");
        return;
      }
      localStorage.setItem(PW_KEY, pwInput);
      setPw(pwInput);
      setPwInput("");
    } catch {
      toast.error("Network error");
    } finally {
      setAuthing(false);
    }
  };

  if (!pw) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the admin password.
          </p>
          <form onSubmit={login} className="mt-6 space-y-3">
            <input
              type="password"
              autoFocus
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-neon focus:ring-1 focus:ring-neon"
            />
            <button
              type="submit"
              disabled={authing || !pwInput}
              className="w-full neon-button rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {authing ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard pw={pw} onLogout={() => { localStorage.removeItem(PW_KEY); setPw(null); }} onPwChange={(v) => { localStorage.setItem(PW_KEY, v); setPw(v); }} />;
}

function AdminDashboard({
  pw,
  onLogout,
  onPwChange,
}: {
  pw: string;
  onLogout: () => void;
  onPwChange: (v: string) => void;
}) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [draft, setDraft] = useState<Cfg | null>(null);
  const [shares, setShares] = useState<ShareItem[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const headers = { "x-admin-password": pw };

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/public/admin/config", { headers }),
        fetch("/api/public/admin/shares", { headers }),
      ]);
      if (cRes.status === 401 || sRes.status === 401) {
        toast.error("Session expired");
        onLogout();
        return;
      }
      const c = await cRes.json();
      const s = await sRes.json();
      setCfg(c);
      setDraft(c);
      setShares(s.shares);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(() => {
      fetch("/api/public/admin/shares", { headers })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setShares(d.shares))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pw]);

  const saveCfg = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/public/admin/config", {
        method: "PUT",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      setCfg(data);
      setDraft(data);
      if (data.admin_password !== pw) onPwChange(data.admin_password);
      toast.success("Config saved");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const deleteShare = async (id: string) => {
    if (!confirm("Delete this share?")) return;
    const res = await fetch("/api/public/admin/shares", {
      method: "DELETE",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    setShares((prev) => prev?.filter((s) => s.id !== id) ?? null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Admin <span className="neon-text">·</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure limits and inspect live shares.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm hover:bg-accent"
          >
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />
            Refresh
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Config</h2>
        {!draft ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Share TTL (minutes)"
              hint="How long a share lives before auto-deletion."
              value={draft.share_ttl_minutes}
              min={1}
              max={1440}
              onChange={(v) => setDraft({ ...draft, share_ttl_minutes: v })}
            />
            <NumberField
              label="Inactive cutoff (seconds)"
              hint="If sender heartbeat stops for this long, share is killed."
              value={draft.inactive_seconds}
              min={5}
              max={3600}
              onChange={(v) => setDraft({ ...draft, inactive_seconds: v })}
            />
            <NumberField
              label="Max total bytes per share"
              hint={`Currently ${formatBytes(draft.max_total_bytes)}.`}
              value={draft.max_total_bytes}
              min={1024}
              max={5 * 1024 * 1024 * 1024}
              onChange={(v) => setDraft({ ...draft, max_total_bytes: v })}
            />
            <NumberField
              label="Max files per share"
              hint="Hard cap on multi-file uploads."
              value={draft.max_files}
              min={1}
              max={50}
              onChange={(v) => setDraft({ ...draft, max_files: v })}
            />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Admin password</label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Used to access this page. Default: <code>admin123</code>.
              </p>
              <input
                value={draft.admin_password}
                onChange={(e) => setDraft({ ...draft, admin_password: e.target.value })}
                className="mt-2 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm font-mono outline-none focus:border-neon focus:ring-1 focus:ring-neon"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              {cfg && JSON.stringify(cfg) !== JSON.stringify(draft) && (
                <button
                  onClick={() => setDraft(cfg)}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-sm hover:bg-accent"
                >
                  Revert
                </button>
              )}
              <button
                onClick={saveCfg}
                disabled={saving}
                className="inline-flex items-center gap-2 neon-button rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save config
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Live shares{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({shares?.length ?? 0})
            </span>
          </h2>
        </div>

        {!shares ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : shares.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No active shares.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Content</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2 pr-3">Last seen</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {shares.map((s) => (
                  <tr key={s.id} className="border-b border-border/40 align-top">
                    <td className="py-3 pr-3 font-mono font-bold neon-text">
                      {s.code}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {s.kind}
                      </span>
                      {s.oneTime && (
                        <span className="ml-1 rounded-full border border-neon/50 px-2 py-0.5 text-[10px] text-neon">
                          1×
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 max-w-xs">
                      {s.kind === "text" ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {s.textPreview ?? "(empty)"}
                        </p>
                      ) : (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {(s.files.length ? s.files : []).map((f) => (
                            <div key={f.id} className="truncate">
                              <span className="text-foreground">{f.name}</span>{" "}
                              · {formatBytes(f.size)}
                            </div>
                          ))}
                          {s.files.length === 0 && s.legacyFile && (
                            <div className="truncate">
                              <span className="text-foreground">
                                {s.legacyFile.name}
                              </span>{" "}
                              · {formatBytes(s.legacyFile.size)}
                            </div>
                          )}
                          {s.files.length === 0 && !s.legacyFile && (
                            <span>(no files)</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground font-mono">
                      {relTime(s.expiresAt)}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground font-mono">
                      {relTime(s.lastSeenAt)}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <button
                        onClick={() => deleteShare(s.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="mt-2 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm font-mono outline-none focus:border-neon focus:ring-1 focus:ring-neon"
      />
    </div>
  );
}

function relTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const sec = Math.round(abs / 1000);
  const sign = diff >= 0 ? "in " : "";
  const suffix = diff >= 0 ? "" : " ago";
  if (sec < 60) return `${sign}${sec}s${suffix}`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${sign}${min}m${suffix}`;
  const hr = Math.round(min / 60);
  return `${sign}${hr}h${suffix}`;
}
