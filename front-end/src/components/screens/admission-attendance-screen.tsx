"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isoDate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { canManageAdmissions } from "@/lib/permissions";
import { attendanceSchema, type AttendanceInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { ATTENDANCE_MARKS, type AttendanceEntry } from "@/lib/types";

export function AdmissionAttendance({ id }: { id: string }) {
  const data = useAcademy();
  const admission = data.admissions.find((item) => item.id === id);
  const manage = data.user ? canManageAdmissions(data.user.role, data.permissions) : false;
  const batches = admission
    ? admission.batchIds
        .map((batchId) => data.batches.find((batch) => batch.id === batchId))
        .filter((batch) => batch !== undefined)
    : [];
  const rows = useMemo(() => {
    if (!admission) return [];
    return [...admission.attendance].sort((a, b) => b.date.localeCompare(a.date) || a.batchId.localeCompare(b.batchId));
  }, [admission]);

  const columns = useMemo<AppColumn<AttendanceEntry>[]>(() => {
    const batchName = (batchId: string) => data.batches.find((batch) => batch.id === batchId)?.name ?? "Batch";
    return [
      {
        accessorKey: "date",
        header: "Date",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      {
        id: "batch",
        header: "Batch",
        accessorFn: (row) => batchName(row.batchId),
        sortFn: "text",
      },
      {
        accessorKey: "status",
        header: "Status",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
      {
        accessorKey: "note",
        header: "Note",
        sortFn: "text",
        cell: (info) => String(info.getValue() || "—"),
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        cell: (info) => {
          if (!manage || !admission || !data.user) return null;
          const entry = info.row.original;
          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={(event) => {
                event.stopPropagation();
                const result = data.removeAttendance(admission.id, entry.id, data.user!.name);
                if (!result.ok) toast.error(result.message);
                else toast.success("Attendance removed");
              }}
            >
              Remove
            </Button>
          );
        },
      },
    ];
  }, [admission, data, manage]);

  if (!admission || !data.user) return null;

  const present = admission.attendance.filter((entry) => entry.status === "Present").length;
  const absent = admission.attendance.filter((entry) => entry.status === "Absent").length;
  const late = admission.attendance.filter((entry) => entry.status === "Late").length;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>
            {present} present · {absent} absent · {late} late
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {manage ? <AttendanceForm admissionId={admission.id} batches={batches} /> : null}
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance has been marked yet.</p>
          ) : (
            <DataTable data={rows} columns={columns} searchPlaceholder="Search dates, batches or notes" pageSize={8} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceForm({
  admissionId,
  batches,
}: {
  admissionId: string;
  batches: { id: string; name: string }[];
}) {
  const data = useAcademy();
  const form = useForm<AttendanceInput>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: isoDate(new Date()),
      batchId: batches[0]?.id ?? "",
      status: "Present",
      note: "",
    },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-3 border-b pb-4 sm:grid-cols-2"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.recordAttendance(admissionId, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Attendance marked");
        form.reset({ ...values, note: "" });
      })}
    >
      <Field label="Date" error={errors.date?.message}>
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />}
        />
      </Field>
      <Field label="Batch" error={errors.batchId?.message}>
        <Controller
          control={form.control}
          name="batchId"
          render={({ field }) => (
            <OptionSelect
              value={field.value}
              onChange={field.onChange}
              options={batches.map((batch) => ({ value: batch.id, label: batch.name }))}
              placeholder={batches.length ? "Batch" : "Attach a batch first"}
              disabled={batches.length === 0}
            />
          )}
        />
      </Field>
      <Field label="Status" error={errors.status?.message}>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <OptionSelect value={field.value} onChange={field.onChange} options={[...ATTENDANCE_MARKS]} />
          )}
        />
      </Field>
      <Field label="Note" htmlFor="attendance-note" error={errors.note?.message}>
        <Input id="attendance-note" placeholder="Optional" {...form.register("note")} />
      </Field>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" className="w-fit" disabled={batches.length === 0}>
          Mark attendance
        </Button>
      </div>
    </form>
  );
}
