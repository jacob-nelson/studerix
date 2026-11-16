"use client";

import { Input } from "@/components/ui/input";
import type { Period } from "@/lib/dates";
import { cn } from "@/lib/utils";

const OPTIONS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All dates" },
  { id: "custom", label: "Custom" },
];

export function PeriodFilter({
  period,
  from,
  to,
  onPeriod,
  onFrom,
  onTo,
}: {
  period: Period;
  from: string;
  to: string;
  onPeriod: (period: Period) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onPeriod(option.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              period === option.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(event) => onFrom(event.target.value)}
            aria-label="From date"
            className="w-40 bg-card"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={to}
            onChange={(event) => onTo(event.target.value)}
            aria-label="To date"
            className="w-40 bg-card"
          />
        </div>
      ) : null}
    </div>
  );
}
