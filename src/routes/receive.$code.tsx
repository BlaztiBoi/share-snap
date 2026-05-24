import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { formatBytes } from "@/lib/format";

export const Route = createFileRoute("/receive/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Receive ${params.code} — Blazt Share` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiveCodePage,
});

type ShareInfo = {
  kind: "text" | "file";
  text: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
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
  const [downloading, setDownloading] = useState(false);
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
    // Poll every 5s while watching the receiver page (detects expiry / sender exit)
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
          <h1 className="text-2xl font-bold">Code {code}</h1>
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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/public/download/${code}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Download failed");
        return;
      }
      // Trigger download
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName ?? "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (share.oneTime) setConsumed(true);
    } catch {
      toast.error("Network error");
    } finally {
      setDownloading(false);
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
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
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
            <div className="rounded-lg border border-border bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 neon-border">
                  <FileIcon className="h-6 w-6 text-neon" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{share.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {share.fileSize ? formatBytes(share.fileSize) : ""}
                    {share.mimeType ? ` · ${share.mimeType}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || consumed}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 neon-button rounded-md px-5 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {consumed
                  ? "Downloaded"
                  : downloading
                    ? "Preparing…"
                    : "Download file"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
