import { Link, type LinkProps } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useNavigatingTo } from "@/hooks/useNavigatingTo";

type NavigatingLinkProps = Omit<LinkProps, "to"> & {
  to: string;
  loadingLabel?: string;
};

/** Link that shows a spinner as soon as it's clicked, until the target route is ready. */
export function NavigatingLink({
  to,
  children,
  className,
  loadingLabel = "Loading…",
  onClick,
  ...props
}: NavigatingLinkProps) {
  const { loading, onNavigate } = useNavigatingTo(to);

  return (
    <Link
      to={to}
      className={className}
      aria-busy={loading}
      onClick={(e) => {
        onNavigate();
        onClick?.(e);
      }}
      {...props}
    >
      {loading ? (
        <span className="flex min-h-[6rem] flex-col items-center justify-center gap-3 py-4">
          <Loader2 className="h-8 w-8 shrink-0 animate-spin text-neon" />
          <span className="text-sm text-muted-foreground">{loadingLabel}</span>
        </span>
      ) : (
        children
      )}
    </Link>
  );
}
