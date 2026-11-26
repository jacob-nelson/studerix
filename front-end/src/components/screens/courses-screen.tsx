"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/format";
import { onBatch } from "@/lib/records";
import { accessLevel, canManageCourses } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";

interface CourseRow {
  id: string;
  name: string;
  duration: string;
  fee: number;
  batches: number;
  students: number;
}

export function CoursesScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "courses", data.permissions) : "none";
  const manage = data.user ? canManageCourses(data.user.role, data.permissions) : false;

  const rows = useMemo<CourseRow[]>(
    () =>
      data.courses.map((course) => ({
        id: course.id,
        name: course.name,
        duration: `${course.durationWeeks} weeks`,
        fee: course.fee,
        batches: data.batches.filter((batch) => batch.courseId === course.id).length,
        students: data.admissions.filter((admission) =>
          data.batches.some((batch) => batch.courseId === course.id && onBatch(admission, batch.id)),
        ).length,
      })),
    [data],
  );

  const columns = useMemo<AppColumn<CourseRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Course",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      { accessorKey: "duration", header: "Duration", sortFn: "text" },
      {
        accessorKey: "fee",
        header: "Fee",
        sortFn: "basic",
        cell: (info) => formatInr(Number(info.getValue())),
      },
      { accessorKey: "batches", header: "Batches", sortFn: "basic" },
      { accessorKey: "students", header: "Students", sortFn: "basic" },
    ],
    [],
  );

  if (level === "none") return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Courses"
        description="Duration, fee, payment plans and syllabus live on the course. Each batch keeps its own schedule, and students hang off a batch."
        actions={
          manage ? (
            <Button asChild>
              <Link href="/courses/new">New course</Link>
            </Button>
          ) : null
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search courses"
        onRowClick={(row) => router.push(`/courses/${row.id}`)}
      />
    </div>
  );
}
