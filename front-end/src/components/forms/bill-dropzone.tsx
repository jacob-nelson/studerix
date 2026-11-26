"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BillFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_BYTES = 1_500_000;

function accepted(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function BillDropzone({
  value,
  onChange,
  onInvalid,
}: {
  value: BillFile[];
  onChange: (files: BillFile[]) => void;
  onInvalid?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function addFiles(list: FileList | File[]) {
    const incoming = [...list];
    if (incoming.length === 0) return;
    const room = MAX_FILES - value.length;
    if (room <= 0) {
      onInvalid?.("Attach up to 5 bills");
      return;
    }
    if (incoming.length > room) onInvalid?.("Attach up to 5 bills");
    const chosen = incoming.slice(0, room).filter((file) => {
      if (!accepted(file)) {
        onInvalid?.("Use a PDF or an image");
        return false;
      }
      if (file.size > MAX_BYTES) {
        onInvalid?.("Each bill must be under 1.5 MB");
        return false;
      }
      return true;
    });
    Promise.all(
      chosen.map(
        (file) =>
          new Promise<BillFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") resolve({ name: file.name, type: file.type, dataUrl: reader.result });
              else reject(new Error("unreadable"));
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((files) => onChange([...value, ...files].slice(0, MAX_FILES)))
      .catch(() => onInvalid?.("That bill could not be read"));
  }

  return (
    <div className="grid gap-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "grid cursor-pointer gap-1 rounded-lg border border-dashed px-4 py-8 text-center",
          over ? "border-foreground bg-muted" : "border-input",
        )}
      >
        <span className="text-sm font-medium">Drop bills here, or click to choose files</span>
        <span className="text-xs text-muted-foreground">PDF or image. Up to 5 files, 1.5 MB each.</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {value.length > 0 ? (
        <ul className="grid gap-2">
          {value.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                {file.type.startsWith("image/") ? (
                  <img src={file.dataUrl} alt="" className="size-10 rounded-md object-cover" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-md bg-muted text-xs text-muted-foreground">PDF</span>
                )}
                <span className="truncate">{file.name}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => onChange(value.filter((_, item) => item !== index))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
