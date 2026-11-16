import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  New: "bg-sky-100 text-sky-900",
  Contacted: "bg-slate-200 text-slate-800",
  "Follow-up": "bg-amber-100 text-amber-950",
  Interested: "bg-teal-100 text-teal-950",
  Joined: "bg-emerald-100 text-emerald-950",
  "Not interested": "bg-stone-200 text-stone-700",
  Closed: "bg-stone-200 text-stone-600",
  Eligible: "bg-sky-100 text-sky-900",
  "In process": "bg-amber-100 text-amber-950",
  Offered: "bg-teal-100 text-teal-950",
  "Joined company": "bg-emerald-100 text-emerald-950",
  "On hold": "bg-stone-200 text-stone-700",
  Sourced: "bg-slate-200 text-slate-800",
  Screening: "bg-sky-100 text-sky-900",
  Interview: "bg-amber-100 text-amber-950",
  Placed: "bg-emerald-100 text-emerald-950",
  Dropped: "bg-stone-200 text-stone-600",
  Active: "bg-emerald-100 text-emerald-950",
  Inactive: "bg-stone-200 text-stone-600",
  payment: "bg-emerald-100 text-emerald-950",
  refund: "bg-rose-100 text-rose-900",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONES[value])}>
      {value === "payment" ? "Payment" : value === "refund" ? "Refund" : value}
    </Badge>
  );
}
