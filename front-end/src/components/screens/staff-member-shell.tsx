"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";

export function StaffMemberShell({ id, children }: { id: string; children: ReactNode }) {
  const data = useAcademy();
  const pathname = usePathname();
  const person = data.staff.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";
  const base = `/staff/${id}`;

  if (level === "none") return <AccessDenied />;
  if (!person || !data.user) return <MissingRecord href="/staff" label="Back to staff" />;

  const sections = [
    { href: base, label: "Profile", exact: true },
    { href: `${base}/salary`, label: "Salary", exact: false, count: person.transfers.length },
    { href: `${base}/attendance`, label: "Attendance", exact: false, count: person.attendance.length },
  ];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <PageHeader
        eyebrow={person.id}
        title={person.name}
        description={`${person.kind} · ${person.role}`}
        leading={
          person.photo ? <img src={person.photo} alt="" className="size-16 rounded-lg object-cover" /> : null
        }
        actions={
          <>
            <StatusBadge value={person.kind} />
            <StatusBadge value={person.active ? "Active" : "Inactive"} />
            <Button asChild variant="outline">
              <Link href="/staff">Back to staff</Link>
            </Button>
          </>
        }
      />
      <nav aria-label="Staff member sections" className="flex gap-1 overflow-x-auto border-b">
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
