import { Loader2 } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

function labelForPath(pathname: string): string {
  if (pathname.startsWith("/send")) return "Opening Send…";
  if (pathname.startsWith("/receive")) return "Opening Receive…";
  if (pathname.startsWith("/admin")) return "Opening Admin…";
  return "Loading…";
}

/** Full-page loading veil below the header while a route transition is in progress. */
export function NavigationOverlay() {
  const { pending, label } = useRouterState({
    select: (s) => ({
      pending: s.status === "pending",
      label: labelForPath(s.location.pathname),
    }),
  });

  if (!pending) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[72px] z-40 flex flex-col items-center justify-center gap-4 bg-background/75 backdrop-blur-md"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 animate-spin text-neon" strokeWidth={2} />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
