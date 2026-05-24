import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Send, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blazt Share — Instant file & text sharing" },
      {
        name: "description",
        content:
          "Send text and files with a 4-digit code. Anonymous, temporary, no accounts.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground mb-6">
          <Zap className="h-3 w-3 text-neon" />
          No accounts · 30-minute expiry · 25 MB max
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Share anything with a <span className="neon-text">4-digit code</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Drop a file or paste some text. Get a code and a QR. Anyone with the
          code can grab it — instantly.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          to="/send"
          className="group glass rounded-2xl p-8 hover:border-neon transition-all hover:-translate-y-1"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 neon-border mb-5 group-hover:scale-110 transition-transform">
            <Send className="h-7 w-7 text-neon" />
          </div>
          <h2 className="text-2xl font-bold">Send</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a file or paste text. Generate a shareable code.
          </p>
        </Link>

        <Link
          to="/receive"
          className="group glass rounded-2xl p-8 hover:border-neon transition-all hover:-translate-y-1"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 neon-border mb-5 group-hover:scale-110 transition-transform">
            <Download className="h-7 w-7 text-neon" />
          </div>
          <h2 className="text-2xl font-bold">Receive</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Got a code? Enter it to grab the shared content.
          </p>
        </Link>
      </div>
    </div>
  );
}
