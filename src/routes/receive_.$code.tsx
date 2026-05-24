import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { formatBytes } from "@/lib/format";

export const Route = createFileRoute("/receive_/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Receive ${params.code} — Blazt Share` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiveCodePage,
});

type ShareFileInfo = {
  id: string;
  name: string;
  size: number;
  mimeType: string | null;
};

type ShareInfo = {
  kind: "text" | "file";
  text: string | null;
  files: ShareFileInfo[];
  oneTime: boolean;
  expiresAt: string;
};

function ReceiveCodePage() {
  const { code } = Route.useParams();
  const [state, setState] = useState<
    | { type: "loading" }
    | { type: "error"; message: string }
    | { type: "ok"; share: ShareInfo }
  >({ type: "loading" });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [consumedIds, setConsumedIds] = useState<Set<string>>(new Set());
  const [consumed, setConsumed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchShare = async () => {
      try {
        const res = await fetch(`/api/public/shares/${code}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ type: "error", message: data.error ?? "Unavailable" });
          if (interval) clearInterval(interval);
          return;
        }
        setState({ type: "ok", share: data });
      } catch {
        if (!cancelled) setState({ type: "error", message: "Network error" });
      }
    };

    fetchShare();
    interval = setInterval(() => {
      if (!consumed) fetchShare();
    }, 5000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [code, consumed]);

  if (state.type === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neon" />
        <p className="mt-3 text-sm text-muted-foreground">
          Loading share {code}…
        </p>
      </div>
    );
  }

  if (state.type === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold">
            Code <span className="font-mono neon-text">{code}</span>
          </h1>
          <p className="mt-3 text-sm text-destructive">{state.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            The share may have expired, been downloaded already, or the sender
            closed their tab.
          </p>
          <a
            href="/receive"
            className="mt-6 inline-flex rounded-md border border-border bg-secondary px-4 py-2 text-sm hover:bg-accent"
          >
            Try another code
          </a>
        </div>
      </div>
    );
  }

  const { share } = state;

  const downloadFile = async (file: ShareFileInfo) => {
    setDownloadingId(file.id);
    try {
      const res = await fetch(
        `/api/public/download/${code}?fileId=${encodeURIComponent(file.id)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Download failed");
        return;
      }
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName ?? file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      const next = new Set(consumedIds);
      next.add(file.id);
      setConsumedIds(next);
      if (share.oneTime && next.size >= share.files.length) {
        await fetch(`/api/public/consume/${code}`, { method: "POST" }).catch(
          () => {},
        );
        setConsumed(true);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDownloadingId(null);
    }
  };

  const onCopyText = () => {
    if (share.oneTime) {
      fetch(`/api/public/consume/${code}`, { method: "POST" }).catch(() => {});
      setConsumed(true);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Code
            </p>
            <p className="font-mono text-2xl font-bold neon-text">{code}</p>
          </div>
          {share.oneTime && (
            <span className="rounded-full border border-neon px-3 py-1 text-xs text-neon">
              One-time
            </span>
          )}
        </div>

        <div className="mt-6">
          {share.kind === "text" ? (
            <div>
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background/60 p-4 text-sm font-mono">
                {share.text}
              </pre>
              <div className="mt-4">
                <span onClick={onCopyText}>
                  <CopyButton value={share.text ?? ""} label="Copy text" />
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {share.files.map((f) => {
                const done = consumedIds.has(f.id);
                const busy = downloadingId === f.id;
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 neon-border shrink-0">
                      <FileIcon className="h-5 w-5 text-neon" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatBytes(f.size)}
                        {f.mimeType ? ` · ${f.mimeType}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadFile(f)}
                      disabled={busy || (share.oneTime && done)}
                      className="inline-flex items-center gap-2 neon-button rounded-md px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {done ? "Got it" : busy ? "…" : "Download"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
