"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";

export function StaffShell({ children }: { children: ReactNode }) {
  const data = useAcademy();
  const pathname = usePathname();
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";

  if (level === "none") return <AccessDenied />;

  const sections = [
    { href: "/staff", label: "People", count: data.staff.length, exact: true },
    { href: "/staff/roles", label: "Roles", exact: false },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="People"
        title="Staff"
        description="Onboard teaching and non-teaching staff. Assign one or more of them from a batch."
        actions={
          level === "write" ? (
            <Button asChild>
              <Link href="/staff/new">Onboard staff</Link>
            </Button>
          ) : null
        }
      />
      <nav aria-label="Staff sections" className="flex gap-1 overflow-x-auto border-b">
        {sections.map((section) => {
          const current = section.exact ? pathname === section.href : pathname.startsWith(section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium",
                current
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {section.label}
              {"count" in section && section.count !== undefined ? (
                <span className="text-xs tabular-nums text-muted-foreground">{section.count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
