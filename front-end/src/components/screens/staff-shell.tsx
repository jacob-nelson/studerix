"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";

import { HeaderSearch, PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";

const StaffSearchContext = createContext({ query: "", setQuery: (_value: string) => {} });

export function useStaffSearch() {
  return useContext(StaffSearchContext);
}

export function StaffShell({ children }: { children: ReactNode }) {
  const data = useAcademy();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";
  const searchLabel = pathname.startsWith("/staff/roles") ? "Search permissions" : "Search staff";

  if (level === "none") return <AccessDenied />;

  const sections = [
    { href: "/staff/dashboard", label: "Dashboard", exact: false },
    { href: "/staff", label: "People", count: data.staff.length, exact: true },
    { href: "/staff/roles", label: "Roles", exact: false },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="People"
        title="Staff"
        description="See who is in, who is on leave, and open a person for their attendance and leave history."
        actions={
          <HeaderSearch
            action={
              level === "write" ? (
                <Button asChild>
                  <Link href="/staff/new">Onboard staff</Link>
                </Button>
              ) : null
            }
            value={query}
            onChange={setQuery}
            placeholder={searchLabel}
          />
        }
      />
      <StaffSearchContext.Provider value={{ query, setQuery }}>
      <div className="flex border-b">
      <nav aria-label="Staff sections" className="flex min-w-0 gap-1 overflow-x-auto">
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
      </div>
      {children}
      </StaffSearchContext.Provider>
    </div>
  );
}
