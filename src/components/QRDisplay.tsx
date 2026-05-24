import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QRDisplay({ value, size = 220 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: {
        dark: "#8bb8d4",
        light: "#00000000",
      },
      errorCorrectionLevel: "M",
    }).catch(() => {});
  }, [value, size]);

  return (
    <div className="inline-flex items-center justify-center rounded-xl border border-border bg-background/70 p-4">
      <canvas ref={ref} style={{ width: size, height: size }} />
    </div>
  );
}
