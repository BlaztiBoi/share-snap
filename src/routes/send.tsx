import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dropzone } from "@/components/Dropzone";
import { CopyButton } from "@/components/CopyButton";
import { QRDisplay } from "@/components/QRDisplay";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useCountdown } from "@/hooks/useCountdown";

export const Route = createFileRoute("/send")({
  loader: () => void 0,
  pendingMs: 0,
  head: () => ({
    meta: [
      { title: "Send - Blazt Share" },
      {
        name: "description",
        content: "Upload files or paste text to generate a 4-digit share code.",
      },
    ],
  }),
  component: SendPage,
});

type Mode = "text" | "file";

type PublicCfg = {
  max_files: number;
  max_total_bytes: number;
  share_ttl_minutes: number;
};

function SendPage() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [oneTime, setOneTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [cfg] = useState<PublicCfg>({
    max_files: 10,
    max_total_bytes: Number(import.meta.env.VITE_MAX_TOTAL_BYTES) || 100 * 1024 * 1024,
    share_ttl_minutes: 30,
  });

  useHeartbeat(code);
  const countdown = useCountdown(expiresAt);

  const submit = async () => {
    setSubmitting(true);
    try {
      let res: Response;
      if (mode === "text") {
        if (!text.trim()) {
          toast.error("Enter some text");
          setSubmitting(false);
          return;
        }
        res = await fetch("/api/public/shares/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "text", text, oneTime }),
        });
      } else {
        if (files.length === 0) {
          toast.error("Pick at least one file");
          setSubmitting(false);
          return;
        }
        const fd = new FormData();
        for (const f of files) fd.append("files", f);
        fd.append("oneTime", String(oneTime));
        res = await fetch("/api/public/shares/create", {
          method: "POST",
          body: fd,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create share");
        setSubmitting(false);
        return;
      }
      setCode(data.code);
      setExpiresAt(new Date(Date.now() + cfg.share_ttl_minutes * 60 * 1000).toISOString());
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const destroy = async () => {
    if (!code) return;
    if (!confirm("Delete this share now? Receivers will lose access.")) return;
    try {
      await fetch(`/api/public/shares/${code}/deactivate`, {
        method: "POST",
        keepalive: true,
      });
    } catch {
      // Keep the original behavior: reset locally even if the cleanup request fails.
    }
    toast.success("Share deleted");
    reset();
  };

  const reset = () => {
    setCode(null);
    setExpiresAt(null);
    setText("");
    setFiles([]);
    setOneTime(false);
  };

  useEffect(() => {
    if (countdown.expired && code) {
      toast.message("Share expired");
      reset();
    }
  }, [countdown.expired, code]);

  if (code) {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/receive/${code}`
        : `/receive/${code}`;

    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Share code</p>
          <div className="mt-4 font-mono text-7xl font-bold tracking-[0.15em] text-foreground sm:text-8xl">
            {code}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Expires in <span className="font-mono text-foreground">{countdown.text}</span>
            <span className="mx-2">-</span>
            <span>keep this tab open</span>
          </p>

          <div className="mt-8 flex justify-center">
            <QRDisplay value={shareUrl} />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <CopyButton value={code} label="Copy code" />
            <CopyButton value={shareUrl} label="Copy link" />
          </div>

          <p className="mt-6 break-all text-xs text-muted-foreground">{shareUrl}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border bg-secondary px-4 py-2 text-sm hover:bg-accent"
            >
              Share something else
            </button>
            <button
              type="button"
              onClick={destroy}
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete share now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Send</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste text or drop files. You'll get a 4-digit code.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-border bg-secondary/50 p-1">
        <button
          onClick={() => setMode("text")}
          className={
            "rounded-md px-4 py-1.5 text-sm transition-colors " +
            (mode === "text" ? "bg-primary text-primary-foreground" : "")
          }
        >
          Text
        </button>
        <button
          onClick={() => setMode("file")}
          className={
            "rounded-md px-4 py-1.5 text-sm transition-colors " +
            (mode === "file" ? "bg-primary text-primary-foreground" : "")
          }
        >
          Files
        </button>
      </div>

      <div className="mt-6 glass rounded-xl p-6">
        {mode === "text" ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type anything..."
            rows={8}
            maxLength={200_000}
            className="w-full resize-y rounded-md border border-border bg-background/60 p-3 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        ) : (
          <Dropzone
            files={files}
            onFiles={setFiles}
            maxFiles={cfg.max_files}
            maxTotalBytes={cfg.max_total_bytes}
          />
        )}

        <label className="mt-5 flex cursor-pointer select-none items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={oneTime}
            onChange={(e) => setOneTime(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-secondary accent-[color:var(--primary)]"
          />
          Delete after first download
        </label>

        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="neon-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Creating share..." : "Generate code"}
        </button>
      </div>
    </div>
  );
}
