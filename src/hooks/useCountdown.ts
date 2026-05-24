import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export function useCountdown(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return { text: "", expired: false };
  const ms = new Date(expiresAt).getTime() - now;
  return { text: formatCountdown(ms), expired: ms <= 0 };
}
