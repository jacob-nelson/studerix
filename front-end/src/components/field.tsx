import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Field({
  label,
  htmlFor,
  hint,
  info,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  info?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "grid gap-1.5"}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor}>{label}</Label>
        {info ? <InfoHint text={info} /> : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={text}>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
