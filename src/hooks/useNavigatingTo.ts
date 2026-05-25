import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/** True while navigating to `to` (optimistic click + router pending). */
export function useNavigatingTo(to: string) {
  const [optimistic, setOptimistic] = useState(false);
  const { pathname, routerPending } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      routerPending: s.status === "pending",
    }),
  });

  const atTarget =
    pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));

  useEffect(() => {
    if (atTarget) setOptimistic(false);
  }, [atTarget]);

  const loading = optimistic || (routerPending && atTarget);

  return { loading, onNavigate: () => setOptimistic(true) };
}
