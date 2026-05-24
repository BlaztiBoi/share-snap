import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Send, Zap, ShieldCheck, Clock, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blazt Share — Instant file & text sharing" },
      {
        name: "description",
        content:
          "Send text and files with a 4-digit code. Anonymous, ephemeral, no accounts.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="text-center relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/5 px-3 py-1 text-xs text-neon mb-6">
          <Zap className="h-3 w-3" />
          <span className="font-mono">v1.0</span>
          <span className="text-muted-foreground">·</span>
          <span>ephemeral · anonymous · zero-account</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95]">
          Share anything
          <br />
          with a <span className="neon-text">4-digit code</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Drop files or paste text. Get a code and a QR. Anyone with the code
          grabs it — then it vanishes.
        </p>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        <Link
          to="/send"
          className="group glass rounded-2xl p-8 hover:border-neon transition-all hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon/10 blur-3xl group-hover:bg-neon/20 transition-all" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 neon-border mb-5 group-hover:scale-110 transition-transform">
              <Send className="h-7 w-7 text-neon" />
            </div>
            <h2 className="text-2xl font-bold">Send</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload files (up to 100 MB total) or paste text. Generate a
              shareable code instantly.
            </p>
          </div>
        </Link>

        <Link
          to="/receive"
          className="group glass rounded-2xl p-8 hover:border-neon transition-all hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[color:var(--magenta)]/10 blur-3xl group-hover:bg-[color:var(--magenta)]/20 transition-all" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 neon-border mb-5 group-hover:scale-110 transition-transform">
              <Download className="h-7 w-7 text-neon" />
            </div>
            <h2 className="text-2xl font-bold">Receive</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Got a code? Punch it in and grab the share. Works on any device.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Feature
          icon={<Clock className="h-4 w-4" />}
          title="30-min TTL"
          body="Auto-deleted on expiry or when sender leaves."
        />
        <Feature
          icon={<Layers className="h-4 w-4" />}
          title="Multi-file"
          body="Drop multiple files, share them as one code."
        />
        <Feature
          icon={<ShieldCheck className="h-4 w-4" />}
          title="One-time mode"
          body="Vanishes on first download. No traces."
        />
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-xl p-4 flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-neon">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
      </div>
    </div>
  );
}
