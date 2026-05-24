import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, FileIcon } from "lucide-react";
import { formatBytes } from "@/lib/format";

export function Dropzone({
  files,
  onFiles,
  maxFiles,
  maxTotalBytes,
}: {
  files: File[];
  onFiles: (files: File[]) => void;
  maxFiles: number;
  maxTotalBytes: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = useCallback(
    (incoming: File[]) => {
      const merged = [...files, ...incoming].slice(0, maxFiles);
      const total = merged.reduce((s, f) => s + f.size, 0);
      if (total > maxTotalBytes) {
        alert(
          `Total size exceeds ${(maxTotalBytes / (1024 * 1024)).toFixed(0)} MB`,
        );
        return;
      }
      onFiles(merged);
    },
    [files, onFiles, maxFiles, maxTotalBytes],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      add(Array.from(e.dataTransfer.files ?? []));
    },
    [add],
  );

  const remove = (i: number) => {
    const next = files.slice();
    next.splice(i, 1);
    onFiles(next);
  };

  const total = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all " +
          (dragOver
            ? "border-neon bg-neon/5 shadow-[0_0_40px_-10px_var(--neon)]"
            : "border-border hover:border-primary/60 hover:bg-secondary/40")
        }
      >
        <UploadCloud className="h-8 w-8 text-neon" />
        <div>
          <p className="text-sm font-medium">
            Drop files or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Up to {maxFiles} files · {(maxTotalBytes / (1024 * 1024)).toFixed(0)} MB total
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="rounded-lg border border-border bg-secondary/30 divide-y divide-border/50">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <FileIcon className="h-4 w-4 text-neon shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(f.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-md p-1.5 hover:bg-accent"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground bg-background/40">
            <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>
            <span className="font-mono">{formatBytes(total)} / {(maxTotalBytes / (1024 * 1024)).toFixed(0)} MB</span>
          </div>
        </div>
      )}
    </div>
  );
}
