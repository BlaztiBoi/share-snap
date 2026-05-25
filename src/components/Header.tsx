import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { NavigatingLink } from "@/components/NavigatingLink";

export function Header() {
  return (
    <header className="relative z-10 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-neon neon-border">
            <Zap className="h-5 w-5 text-neon" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Blazt<span className="neon-text">Share</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavigatingLink
            to="/send"
            loadingLabel="Send"
            className="min-w-[4.5rem] px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            Send
          </NavigatingLink>
          <NavigatingLink
            to="/receive"
            loadingLabel="Receive"
            className="min-w-[5.5rem] px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            Receive
          </NavigatingLink>
        </nav>
      </div>
    </header>
  );
}
