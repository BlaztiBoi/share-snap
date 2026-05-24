import { useCallback, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { formatBytes } from "@/lib/format";

const MAX = 25 * 1024 * 1024;

export function Dropzone({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      if (f.size > MAX) {
        alert("File too large (max 25 MB)");
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.size)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onFile(null)}
          className="ml-3 rounded-md p-2 hover:bg-accent"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors " +
        (dragOver
          ? "border-neon bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-secondary/30")
      }
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">Drop a file or click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">
          Up to 25 MB · images, video, PDF, ZIP, anything
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > MAX) {
            alert("File too large (max 25 MB)");
            return;
          }
          onFile(f);
        }}
      />
    </div>
  );
}
