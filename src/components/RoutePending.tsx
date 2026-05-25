import { Loader2 } from "lucide-react";

/** Shown in the outlet while a route's code/data is loading (TanStack pendingComponent). */
export function RoutePending() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <Loader2 className="h-10 w-10 animate-spin text-neon" strokeWidth={2} />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
