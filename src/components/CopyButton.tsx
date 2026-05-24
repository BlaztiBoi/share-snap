import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent transition-colors " +
        (className ?? "")
      }
    >
      {copied ? (
        <Check className="h-4 w-4 text-neon" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
