import { useEffect } from "react";

/**
 * Sends a heartbeat every 20s. On pagehide, fires sendBeacon to deactivate
 * (delete) the share so the receiver immediately sees it as gone.
 */
export function useHeartbeat(code: string | null) {
  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    const ping = () => {
      if (cancelled) return;
      fetch(`/api/public/shares/${code}/heartbeat`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const id = setInterval(ping, 20_000);

    const onHide = () => {
      const url = `/api/public/shares/${code}/deactivate`;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
      } else {
        fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [code]);
}
