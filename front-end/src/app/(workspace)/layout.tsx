import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-full place-items-center text-sm text-muted-foreground">
          Opening the desk…
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
