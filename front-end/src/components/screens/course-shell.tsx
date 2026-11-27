"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { AccessDenied, MissingRecord } from "@/components/states";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";

export function CourseShell({ id, children }: { id: string; children: ReactNode }) {
  const data = useAcademy();
  const pathname = usePathname();
  const course = data.courses.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "courses", data.permissions) : "none";
  const base = `/courses/${id}`;
  const courseBatches = data.batches.filter((batch) => batch.courseId === id);
  const classes = courseBatches.reduce((sum, batch) => sum + batch.schedule.length, 0);
  const tests = data.tests.filter((test) => courseBatches.some((batch) => batch.id === test.batchId)).length;

  if (level === "none") return <AccessDenied />;
  if (!course || !data.user) return <MissingRecord href="/courses" label="Back to courses" />;

  const sections = [
    { href: base, label: "Details" },
    { href: `${base}/fees`, label: "Fee plans", count: course.feePlans.length },
    { href: `${base}/syllabus`, label: "Syllabus", count: course.syllabus.length },
    { href: `${base}/batches`, label: "Batches", count: courseBatches.length },
    { href: `${base}/classes`, label: "Classes", count: classes },
    { href: `${base}/tests`, label: "Tests", count: tests },
  ];

  const wide = /\/batches\/[^/]+/.test(pathname) || pathname.endsWith("/classes") || pathname.endsWith("/tests");

  return (
    <div className={cn("mx-auto grid w-full gap-6", wide ? "max-w-6xl" : "max-w-3xl")}>
      <PageHeader
        eyebrow={course.id}
        title={course.name}
        description={course.summary || "No summary yet."}
        actions={
          <Button asChild variant="outline">
            <Link href="/courses">All courses</Link>
          </Button>
        }
      />
      <nav aria-label="Course sections" className="flex gap-1 overflow-x-auto border-b">
        {sections.map((section) => {
          const current = section.href === base ? pathname === base : pathname.startsWith(section.href);
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
              {"count" in section ? (
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
