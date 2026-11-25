"use client";

import { cn } from "cn";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  invalid,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn("w-full bg-card", className)} aria-invalid={invalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[80]">
        {options.map((option) => {
          const choice = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
