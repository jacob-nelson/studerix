"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Facts } from "@/components/facts";
import { Field } from "@/components/field";
import { OptionSelect } from "@/components/forms/option-select";
import { HeaderSearch, PageHeader } from "@/components/page-header";
import { PeriodFilter } from "@/components/period-filter";
import { TestForm } from "@/components/screens/batch-tests";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inPeriod, periodBounds, type Period } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { accessLevel, canManageAdmissions } from "@/lib/permissions";
import { onBatch, studentForAdmission, testMarkLabel, testStanding } from "@/lib/records";
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
  standing: "Conducted" | "Upcoming" | "Cancelled";
}

function useCourseAccess() {
  const data = useAcademy();
  const allowed = data.user ? accessLevel(data.user.role, "courses", data.permissions) !== "none" : false;
  return { data, allowed };
}

export function TestsScreen({ courseId }: { courseId?: string }) {
  const { data, allowed } = useCourseAccess();
  const router = useRouter();
  const record = data.user ? canManageAdmissions(data.user.role, data.permissions) : false;
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [courseFilter, setCourseFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const scopedCourse = courseId || (courseFilter === "all" ? "" : courseFilter);
  const batchChoices = data.batches.filter((batch) => !scopedCourse || batch.courseId === scopedCourse);
  const [createBatchId, setCreateBatchId] = useState(batchChoices[0]?.id ?? "");
  const bounds = periodBounds(period, from, to);

  const rows = useMemo<TestRow[]>(() => {
    return data.tests.flatMap((test) => {
      const batch = data.batches.find((item) => item.id === test.batchId);
      if (!batch) return [];
      if (courseId && batch.courseId !== courseId) return [];
      if (!courseId && courseFilter !== "all" && batch.courseId !== courseFilter) return [];
      if (batchFilter !== "all" && batch.id !== batchFilter) return [];
      const standing = testStanding(test);
      if (statusFilter !== "all" && standing !== statusFilter) return [];
      if (!inPeriod(test.conductedOn, bounds.from, bounds.to)) return [];
      const course = data.courses.find((item) => item.id === batch.courseId);
      const conductor = data.staff.find((person) => person.id === test.staffId);
      const students = data.admissions.filter((admission) => onBatch(admission, test.batchId)).length;
      return [
        {
          id: test.id,
          title: test.title,
          course: course?.name ?? "Course",
          batch: batch.name,
          date: test.conductedOn,
          conductor: conductor?.name ?? "Staff",
          students,
          maximum: test.maxMarks,
          standing,
        },
      ];
    });
  }, [
    batchFilter,
    bounds.from,
    bounds.to,
    courseFilter,
    courseId,
    data.admissions,
    data.batches,
    data.courses,
    data.staff,
    data.tests,
    statusFilter,
  ]);

  const columns = useMemo<AppColumn<TestRow>[]>(() => {
    const columns: AppColumn<TestRow>[] = [
      {
        accessorKey: "title",
        header: "Test",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
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
    ];
    if (!courseId) columns.splice(1, 0, { accessorKey: "course", header: "Course", sortFn: "text" });
    return columns;
  }, [courseId]);

  if (!data.user) return null;
  if (!allowed) return <AccessDenied />;

  const selectedBatchId = batchChoices.some((batch) => batch.id === createBatchId)
    ? createBatchId
    : (batchChoices[0]?.id ?? "");
  const selectedBatch = data.batches.find((batch) => batch.id === selectedBatchId);
  const teachers = (selectedBatch?.staffIds ?? []).flatMap((staffId) => {
    const person = data.staff.find((item) => item.id === staffId);
    return person && person.kind === "Teaching" && person.active ? [{ id: person.id, name: person.name }] : [];
  });
  const courseOptions = [
    { value: "all", label: "All courses" },
    ...data.courses.map((course) => ({ value: course.id, label: course.name })),
  ];
  const batchOptions = [
    { value: "all", label: "All batches" },
    ...batchChoices.map((batch) => ({
      value: batch.id,
      label: courseId
        ? batch.name
        : `${data.courses.find((course) => course.id === batch.courseId)?.name ?? "Course"} · ${batch.name}`,
    })),
  ];
  const createOptions = batchChoices.map((batch) => ({
    value: batch.id,
    label: courseId
      ? batch.name
      : `${data.courses.find((course) => course.id === batch.courseId)?.name ?? "Course"} · ${batch.name}`,
  }));

  const content = (
    <div className="grid gap-4">
      {record && courseId ? (
        <TestCreateFields
          batchChoices={batchChoices}
          createOptions={createOptions}
          selectedBatchId={selectedBatchId}
          teachers={teachers}
          onBatch={setCreateBatchId}
        />
      ) : null}
      <div className="ml-auto flex flex-col items-end gap-3">
        <div className="flex flex-wrap justify-end gap-2">
          {courseId ? (
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tests or batches"
              aria-label="Search tests or batches"
              className="w-full bg-card sm:w-64"
            />
          ) : null}
          {courseId ? null : (
            <OptionSelect
              value={courseFilter}
              onChange={(value) => {
                setCourseFilter(value);
                setBatchFilter("all");
              }}
              options={courseOptions}
              placeholder="All courses"
              className="w-52"
            />
          )}
          <OptionSelect
            value={batchFilter}
            onChange={setBatchFilter}
            options={batchOptions}
            placeholder="All batches"
            className="w-56"
          />
          <OptionSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All statuses" },
              { value: "Upcoming", label: "Upcoming" },
              { value: "Conducted", label: "Conducted" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
            placeholder="All statuses"
            className="w-40"
          />
        </div>
        <PeriodFilter period={period} from={from} to={to} onPeriod={setPeriod} onFrom={setFrom} onTo={setTo} />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        filter={query}
        initialSorting={[{ id: "date", desc: true }]}
        onRowClick={(row) => router.push(`/courses/tests/${row.id}`)}
      />
    </div>
  );

  if (courseId) return content;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Tests"
        description="Add a test for a batch. Filter the list by course, batch, date, or status."
        actions={
          <div className="grid w-full justify-items-end gap-2 sm:w-80">
            <HeaderSearch value={query} onChange={setQuery} placeholder="Search tests, batches or staff" />
            {record ? (
              <Button type="button" onClick={() => setCreating(true)}>
                New test
              </Button>
            ) : null}
          </div>
        }
      />
      {content}
      {record ? (
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent className="sm:max-w-lg!">
            <DialogHeader>
              <DialogTitle>New test</DialogTitle>
              <DialogDescription>
                Choose the batch, then set the name, date, conductor, and maximum. Marks can be entered afterwards.
              </DialogDescription>
            </DialogHeader>
            <TestCreateFields
              batchChoices={batchChoices}
              createOptions={createOptions}
              selectedBatchId={selectedBatchId}
              teachers={teachers}
              onBatch={setCreateBatchId}
              embedded
              onCreated={() => setCreating(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

function TestCreateFields({
  batchChoices,
  createOptions,
  selectedBatchId,
  teachers,
  onBatch,
  embedded = false,
  onCreated,
}: {
  batchChoices: { id: string }[];
  createOptions: { value: string; label: string }[];
  selectedBatchId: string;
  teachers: { id: string; name: string }[];
  onBatch: (batchId: string) => void;
  embedded?: boolean;
  onCreated?: () => void;
}) {
  if (batchChoices.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a batch before creating a test.</p>;
  }

  return (
    <div className="grid gap-4">
      <Field label="Batch" className={embedded ? undefined : "sm:max-w-xs"}>
        <OptionSelect
          value={selectedBatchId}
          onChange={onBatch}
          options={createOptions}
          placeholder="Choose a batch"
        />
      </Field>
      {selectedBatchId ? (
        <TestForm
          key={`${selectedBatchId}:${teachers.map((person) => person.id).join()}`}
          batchId={selectedBatchId}
          teachers={teachers}
          embedded={embedded}
          onCreated={onCreated}
        />
      ) : null}
    </div>
  );
}

export function TestDetailScreen({ id }: { id: string }) {
  const { data, allowed } = useCourseAccess();
  const router = useRouter();
  const test = data.tests.find((item) => item.id === id);
  const batch = data.batches.find((item) => item.id === test?.batchId);
  const course = data.courses.find((item) => item.id === batch?.courseId);
  const conductor = data.staff.find((person) => person.id === test?.staffId);
  const standing = test ? testStanding(test) : "Conducted";

  const rows = useMemo(() => {
    if (!test) return [];
    const recorded = new Map(test.results.map((result) => [result.admissionId, result]));
    const current = data.admissions
      .filter((admission) => onBatch(admission, test.batchId))
      .map((admission) => {
        const result = recorded.get(admission.id);
        return {
          id: admission.id,
          name: studentForAdmission(data, admission).name,
          mark: testMarkLabel(result, test.maxMarks),
          remarks: result?.remarks ?? "",
        };
      });
    const left = test.results
      .filter((result) => !current.some((row) => row.id === result.admissionId))
      .map((result) => {
        const admission = data.admissions.find((item) => item.id === result.admissionId);
        return {
          id: result.admissionId,
          name: admission ? studentForAdmission(data, admission).name : "Student",
          mark: testMarkLabel(result, test.maxMarks),
          remarks: result.remarks,
        };
      });
    return [...current, ...left];
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
  if (!test || !batch) {
    return <MissingRecord href={course ? `/courses/${course.id}/tests` : "/courses/tests"} label="Back to tests" />;
  }

  const scored = test.results.filter((result) => !result.absent && result.marks !== null);
  const absentCount = test.results.filter((result) => result.absent).length;
  const average =
    scored.length > 0 ? scored.reduce((sum, result) => sum + (result.marks ?? 0), 0) / scored.length : null;
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
              { label: "Absent", value: String(absentCount) },
              { label: "Students", value: String(rows.length) },
              { label: "Status", value: standing },
              { label: "Remarks", value: test.remarks || "—" },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Students on this batch. A dash means the mark has not been entered yet. Absent is recorded separately from a mark.
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
