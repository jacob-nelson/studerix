"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Briefcase,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/format";
import { isoDate } from "@/lib/dates";
import { NAV_ITEMS, accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";
import type { ModuleKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ModuleKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  enquiries: Inbox,
  admissions: GraduationCap,
  expenses: Receipt,
  placements: Briefcase,
  consultancy: Users,
  reports: BarChart3,
  staff: Shield,
  audit: ScrollText,
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAcademy();
  if (!user) return null;

  return (
    <nav className="grid gap-1 px-3">
      {NAV_ITEMS.filter((item) => accessLevel(user.role, item.module) !== "none").map((item) => {
        const Icon = ICONS[item.module];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-5">
      <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
        TM
      </span>
      <span>
        <span className="block font-heading text-lg leading-none">Tech Masters</span>
        <span className="text-xs text-sidebar-foreground/65">Academy desk</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, signOut } = useAcademy();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/sign-in");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-full place-items-center text-sm text-muted-foreground">
        Opening the desk…
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="flex min-h-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <p className="px-4 py-4 text-xs leading-5 text-sidebar-foreground/55">
          Clickable prototype. Records stay in this tab and clear when you refresh.
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <Brand />
              <NavLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="text-sm text-muted-foreground">{formatDate(isoDate(new Date()))}</p>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                    {initials}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm leading-none font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.role}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user.email}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {user.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
