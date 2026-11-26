"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Facts } from "@/components/facts";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { onBatch, studentForAdmission, testStanding } from "@/lib/records";
import { useAcademy } from "@/lib/store";

interface TestRow {
  id: string;
  title: string;
  course: string;
  batch: string;
  date: string;
  conductor: string;
  students: number;
  maximum: number;
  standing: "Conducted" | "Upcoming";
}

function useAdministrator() {
  const data = useAcademy();
  const allowed = data.user?.role === "Administrator";
  return { data, allowed };
}

export function TestsScreen() {
  const { data, allowed } = useAdministrator();
  const router = useRouter();

  const rows = useMemo<TestRow[]>(() => {
    return data.tests.map((test) => {
      const batch = data.batches.find((item) => item.id === test.batchId);
      const course = data.courses.find((item) => item.id === batch?.courseId);
      const conductor = data.staff.find((person) => person.id === test.staffId);
      const standing = testStanding(test.conductedOn);
      const students =
        test.results.length > 0
          ? test.results.length
          : data.admissions.filter((admission) => onBatch(admission, test.batchId)).length;
      return {
        id: test.id,
        title: test.title,
        course: course?.name ?? "Course",
        batch: batch?.name ?? "Batch",
        date: test.conductedOn,
        conductor: conductor?.name ?? "Staff",
        students,
        maximum: test.maxMarks,
        standing,
      };
    });
  }, [data.admissions, data.batches, data.courses, data.staff, data.tests]);

  const columns = useMemo<AppColumn<TestRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Test",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      { accessorKey: "course", header: "Course", sortFn: "text" },
      { accessorKey: "batch", header: "Batch", sortFn: "text" },
      {
        accessorKey: "date",
        header: "Date",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      { accessorKey: "conductor", header: "Conducted by", sortFn: "text" },
      { accessorKey: "students", header: "Students", sortFn: "basic" },
      {
        accessorKey: "maximum",
        header: "Maximum",
        sortFn: "basic",
        cell: (info) => <span className="tabular-nums">{String(info.getValue())}</span>,
      },
      {
        accessorKey: "standing",
        header: "Status",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
    ],
    [],
  );

  if (!data.user) return null;
  if (!allowed) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Tests"
        title="Tests"
        description="Every test across batches. Upcoming tests are still ahead of today. Open one to see the students and their marks."
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search tests, batches or staff"
        searchAlign="end"
        initialSorting={[{ id: "date", desc: true }]}
        onRowClick={(row) => router.push(`/tests/${row.id}`)}
      />
    </div>
  );
}

export function TestDetailScreen({ id }: { id: string }) {
  const { data, allowed } = useAdministrator();
  const router = useRouter();
  const test = data.tests.find((item) => item.id === id);
  const batch = data.batches.find((item) => item.id === test?.batchId);
  const course = data.courses.find((item) => item.id === batch?.courseId);
  const conductor = data.staff.find((person) => person.id === test?.staffId);
  const standing = test ? testStanding(test.conductedOn) : "Conducted";

  const rows = useMemo(() => {
    if (!test) return [];
    if (test.results.length > 0) {
      return test.results.map((result) => {
        const admission = data.admissions.find((item) => item.id === result.admissionId);
        return {
          id: result.admissionId,
          name: admission ? studentForAdmission(data, admission).name : "Student",
          mark: `${result.marks}/${test.maxMarks}`,
          remarks: result.remarks,
        };
      });
    }
    return data.admissions
      .filter((admission) => onBatch(admission, test.batchId))
      .map((admission) => ({
        id: admission.id,
        name: studentForAdmission(data, admission).name,
        mark: "—",
        remarks: "",
      }));
  }, [data, test]);

  const columns = useMemo<AppColumn<(typeof rows)[number]>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Student",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      {
        accessorKey: "mark",
        header: "Mark",
        sortFn: "text",
        cell: (info) => <span className="tabular-nums">{String(info.getValue())}</span>,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        sortFn: "text",
        cell: (info) => String(info.getValue() || "—"),
      },
    ],
    [],
  );

  if (!data.user) return null;
  if (!allowed) return <AccessDenied />;
  if (!test || !batch) return <MissingRecord href="/tests" label="Back to tests" />;

  const scored = test.results;
  const average =
    scored.length > 0 ? scored.reduce((sum, result) => sum + result.marks, 0) / scored.length : null;
  const averageLabel =
    average === null ? "—" : Number.isInteger(average) ? String(average) : average.toFixed(1);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow={test.id}
        title={test.title}
        description={`${course?.name ?? "Course"} · ${batch.name}`}
        actions={
          <>
            <StatusBadge value={standing} />
            <Button asChild variant="outline">
              <Link href={`/courses/${batch.courseId}/batches/${batch.id}`}>Open batch</Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Date", value: formatDate(test.conductedOn) },
              { label: "Conducted by", value: conductor?.name ?? "Staff" },
              { label: "Batch", value: batch.name },
              { label: "Course", value: course?.name ?? "Course" },
              { label: "Maximum", value: String(test.maxMarks) },
              { label: "Average", value: averageLabel },
              { label: "Students", value: String(rows.length) },
              { label: "Status", value: standing },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            {standing === "Upcoming"
              ? "Students on this batch. Marks are recorded once the test is conducted."
              : "Students who sat this test, with the mark and remark recorded for each."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students on this batch yet.</p>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              searchPlaceholder="Search students or remarks"
              searchAlign="end"
              initialSorting={[{ id: "name", desc: false }]}
              onRowClick={(row) => router.push(`/admissions/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
