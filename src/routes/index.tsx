import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Send } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blazt Share - Instant file & text sharing" },
      {
        name: "description",
        content: "Send text and files with a 4-digit code. Anonymous, temporary, no accounts.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Share anything
          <br />
          with a <span className="neon-text">4-digit code</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Drop files or paste text. Get a code and a QR. Anyone with the code can open it.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link to="/send" className="glass rounded-xl p-7 transition-colors hover:border-primary/60">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-neon neon-border">
            <Send className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">Send</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload files up to 100 MB total or paste text. Generate a shareable code instantly.
          </p>
        </Link>

        <Link
          to="/receive"
          className="glass rounded-xl p-7 transition-colors hover:border-primary/60"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-neon neon-border">
            <Download className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">Receive</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a code and download the shared file or text from any device.
          </p>
        </Link>
      </div>
    </div>
  );
}
