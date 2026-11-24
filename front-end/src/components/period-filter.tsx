"use client";

import { DateField } from "@/components/forms/date-field";
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
          <DateField className="w-40" label="From date" value={from} onChange={onFrom} />
          <span className="text-sm text-muted-foreground">to</span>
          <DateField className="w-40" label="To date" value={to} onChange={onTo} />
        </div>
      ) : null}
    </div>
  );
}
