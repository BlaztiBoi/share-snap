import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="relative z-10 border-b border-border/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 neon-border group-hover:scale-110 transition-transform">
            <Zap className="h-5 w-5 text-neon" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Blazt<span className="neon-text">Share</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/send"
            className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
            activeProps={{ className: "text-neon" }}
          >
            Send
          </Link>
          <Link
            to="/receive"
            className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
            activeProps={{ className: "text-neon" }}
          >
            Receive
          </Link>
        </nav>
      </div>
    </header>
  );
}
