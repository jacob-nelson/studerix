"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Field } from "@/components/field";
import { OptionSelect } from "@/components/forms/option-select";
import { HeaderSearch, PageHeader } from "@/components/page-header";
import { BatchForm } from "@/components/screens/course-screen";
import { AccessDenied } from "@/components/states";
import { formatDate } from "@/lib/format";
import { accessLevel, canManageCourses } from "@/lib/permissions";
import { onBatch } from "@/lib/records";
import { useAcademy } from "@/lib/store";

interface BatchRow {
  id: string;
  courseId: string;
  name: string;
  course: string;
  startsOn: string;
  endsOn: string;
  classes: number;
  students: number;
  staff: number;
}

export function BatchesScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "courses", data.permissions) : "none";
  const manage = data.user ? canManageCourses(data.user.role, data.permissions) : false;
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [draftCourseId, setDraftCourseId] = useState(data.courses[0]?.id ?? "");

  const rows = useMemo<BatchRow[]>(() => {
    return data.batches
      .filter((batch) => courseFilter === "all" || batch.courseId === courseFilter)
      .map((batch) => {
        const course = data.courses.find((item) => item.id === batch.courseId);
        return {
          id: batch.id,
          courseId: batch.courseId,
          name: batch.name,
          course: course?.name ?? "Course",
          startsOn: batch.startsOn,
          endsOn: batch.endsOn,
          classes: batch.schedule.length,
          students: data.admissions.filter((admission) => onBatch(admission, batch.id)).length,
          staff: batch.staffIds.length,
        };
      });
  }, [courseFilter, data.admissions, data.batches, data.courses]);

  const columns = useMemo<AppColumn<BatchRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Batch",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      { accessorKey: "course", header: "Course", sortFn: "text" },
      {
        accessorKey: "startsOn",
        header: "Starts",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      {
        accessorKey: "endsOn",
        header: "Ends",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      { accessorKey: "classes", header: "Classes", sortFn: "basic" },
      { accessorKey: "students", header: "Students", sortFn: "basic" },
      { accessorKey: "staff", header: "Staff", sortFn: "basic" },
    ],
    [],
  );

  if (!data.user) return null;
  if (level === "none") return <AccessDenied />;

  const draftCourse = data.courses.find((course) => course.id === draftCourseId);
  const courseOptions = [
    { value: "all", label: "All courses" },
    ...data.courses.map((course) => ({ value: course.id, label: course.name })),
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Batches"
        description="Every batch. Choose a course to attach a new one, and filter the list by course."
        actions={<HeaderSearch value={query} onChange={setQuery} placeholder="Search batches or courses" />}
      />
      {manage ? (
        <div className="grid gap-3">
          <Field label="Course for the new batch">
            <OptionSelect
              value={draftCourseId}
              onChange={setDraftCourseId}
              options={data.courses.map((course) => ({ value: course.id, label: course.name }))}
              placeholder="Choose a course"
              className="sm:w-80"
            />
          </Field>
          {draftCourse ? (
            <BatchForm key={draftCourse.id} courseId={draftCourse.id} durationWeeks={draftCourse.durationWeeks} />
          ) : (
            <p className="text-sm text-muted-foreground">Add a course before attaching a batch.</p>
          )}
        </div>
      ) : null}
      <div className="ml-auto">
        <OptionSelect
          value={courseFilter}
          onChange={setCourseFilter}
          options={courseOptions}
          placeholder="All courses"
          className="w-52"
        />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        filter={query}
        initialSorting={[{ id: "startsOn", desc: true }]}
        onRowClick={(row) => router.push(`/courses/${row.courseId}/batches/${row.id}`)}
      />
    </div>
  );
}
