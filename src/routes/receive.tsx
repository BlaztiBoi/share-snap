import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/receive")({
  head: () => ({
    meta: [
      { title: "Receive — Blazt Share" },
      { name: "description", content: "Enter a 4-digit code to grab a share." },
    ],
  }),
  component: ReceivePage,
});

function ReceivePage() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(code)) return;
    navigate({ to: "/receive/$code", params: { code } });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Receive</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the 4-digit code shared with you.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 glass rounded-xl p-6">
        <input
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="0000"
          className="w-full rounded-md border border-border bg-background/60 px-4 py-4 text-center font-mono text-4xl tracking-[0.5em] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={code.length !== 4}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 neon-button rounded-md px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          Receive <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
