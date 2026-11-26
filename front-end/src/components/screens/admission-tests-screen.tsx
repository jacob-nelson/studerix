"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { useAcademy } from "@/lib/store";

interface StudentTestRow {
  id: string;
  date: string;
  title: string;
  batch: string;
  batchId: string;
  courseId: string;
  mark: string;
  remarks: string;
  conductor: string;
}

export function AdmissionTests({ id }: { id: string }) {
  const data = useAcademy();
  const router = useRouter();
  const admission = data.admissions.find((item) => item.id === id);

  const rows = useMemo<StudentTestRow[]>(() => {
    if (!admission) return [];
    return data.tests
      .flatMap((test) => {
        const result = test.results.find((item) => item.admissionId === admission.id);
        if (!result) return [];
        const batch = data.batches.find((item) => item.id === test.batchId);
        const conductor = data.staff.find((person) => person.id === test.staffId);
        return [
          {
            id: test.id,
            date: test.conductedOn,
            title: test.title,
            batch: batch?.name ?? "Batch",
            batchId: test.batchId,
            courseId: batch?.courseId ?? "",
            mark: `${result.marks}/${test.maxMarks}`,
            remarks: result.remarks,
            conductor: conductor?.name ?? "Staff",
          },
        ];
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  }, [admission, data.batches, data.staff, data.tests]);

  const columns = useMemo<AppColumn<StudentTestRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      { accessorKey: "title", header: "Test", sortFn: "text" },
      { accessorKey: "batch", header: "Batch", sortFn: "text" },
      { accessorKey: "mark", header: "Mark", sortFn: "text" },
      {
        accessorKey: "remarks",
        header: "Remarks",
        sortFn: "text",
        cell: (info) => String(info.getValue() || "—"),
      },
      { accessorKey: "conductor", header: "Conducted by", sortFn: "text" },
    ],
    [],
  );

  if (!admission || !data.user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tests</CardTitle>
        <CardDescription>
          Marks recorded for this student, with the teaching staff member who conducted each test.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tests yet.</p>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            searchPlaceholder="Search tests"
            searchAlign="end"
            pageSize={8}
            initialSorting={[{ id: "date", desc: true }]}
            onRowClick={(row) => {
              if (row.courseId) router.push(`/courses/${row.courseId}/batches/${row.batchId}`);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
