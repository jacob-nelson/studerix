"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdmissionStatusActions } from "@/components/admission-status";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { accessLevel } from "@/lib/permissions";
import { studentForAdmission } from "@/lib/records";
import { useAcademy } from "@/lib/store";

export function AdmissionShell({ id, children }: { id: string; children: ReactNode }) {
  const data = useAcademy();
  const pathname = usePathname();
  const admission = data.admissions.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "admissions", data.permissions) : "none";
  const base = `/admissions/${id}`;

  if (level === "none") return <AccessDenied />;
  if (!admission || !data.user) return <MissingRecord href="/admissions" label="Back to admissions" />;

  const student = studentForAdmission(data, admission);
  const sections = [
    { href: base, label: "Student", exact: true },
    { href: `${base}/fees`, label: "Fees", exact: false },
    { href: `${base}/attendance`, label: "Attendance", exact: false, count: admission.attendance.length },
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow={admission.id}
        title={student.name}
        description={`${student.course || "No course"} · ${admission.batch || "No batch"}`}
        leading={
          student.photo ? (
            <img src={student.photo} alt="" className="size-14 rounded-lg object-cover" />
          ) : null
        }
        actions={
          <>
            <StatusBadge value={admission.status} />
            <AdmissionStatusActions admission={admission} studentName={student.name} />
            <Button asChild variant="outline">
              <Link href={`/enquiries/${admission.enquiryId}`}>Enquiry</Link>
            </Button>
          </>
        }
      />
      <nav aria-label="Admission sections" className="flex gap-1 overflow-x-auto border-b">
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
