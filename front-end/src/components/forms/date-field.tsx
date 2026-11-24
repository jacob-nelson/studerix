"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/lib/format";

export function DateField({
  id,
  label,
  value,
  onChange,
  invalid,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={label}
          aria-invalid={invalid}
          className={cn("w-full justify-start bg-card font-normal", className)}
        >
          <CalendarIcon />
          {value ? formatDate(value) : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(toIsoDate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
