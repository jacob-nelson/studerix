"use client";

import { useRef } from "react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";

export function PhotoField({
  value,
  onChange,
  error,
  onInvalid,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onInvalid?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Field className="grid gap-1.5 sm:col-span-2" label="Photo" error={error}>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="size-16 rounded-lg object-cover" />
        ) : (
          <span className="grid size-16 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">
            Photo
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (!file.type.startsWith("image/")) {
              onInvalid?.("Choose an image file");
              return;
            }
            if (file.size > 1_500_000) {
              onInvalid?.("Use a photo under 1.5 MB");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") onChange(reader.result);
            };
            reader.readAsDataURL(file);
          }}
        />
        <Button type="button" variant="outline" className="w-fit" onClick={() => inputRef.current?.click()}>
          {value ? "Change photo" : "Add photo"}
        </Button>
      </div>
    </Field>
  );
}
