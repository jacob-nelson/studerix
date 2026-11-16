"use client";

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
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full bg-card" aria-invalid={invalid}>
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
