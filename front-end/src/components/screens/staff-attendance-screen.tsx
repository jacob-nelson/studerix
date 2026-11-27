"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { accessLevel } from "@/lib/permissions";
import { attendanceTally } from "@/lib/records";
import { staffAttendanceSchema, type StaffAttendanceInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { ATTENDANCE_MARKS, type StaffAttendance } from "@/lib/types";

export function StaffAttendanceScreen({ id }: { id: string }) {
  const data = useAcademy();
  const person = data.staff.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";
  const form = useForm<StaffAttendanceInput>({
    resolver: zodResolver(staffAttendanceSchema),
    defaultValues: { date: isoDate(new Date()), status: "Present", note: "" },
  });

  if (!person || !data.user) return null;

  const columns: AppColumn<StaffAttendance>[] = [
    {
      accessorKey: "date",
      header: "Date",
      sortFn: "alphanumeric",
      cell: (info) => formatDate(String(info.getValue())),
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
      cell: (info) =>
        level === "write" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              const result = data.removeStaffAttendance(person.id, info.row.original.id, data.user!.name);
              if (!result.ok) toast.error(result.message);
              else toast.success("Attendance removed");
            }}
          >
            Remove
          </Button>
        ) : null,
    },
  ];

  const tally = attendanceTally(person.attendance);
  const tests = data.tests.filter(
    (test) => test.status !== "cancelled" && test.staffId === person.id && test.conductedOn <= isoDate(new Date()),
  ).length;
  const leave = person.attendance
    .filter((entry) => entry.status === "Absent")
    .sort((a, b) => b.date.localeCompare(a.date));
  const leaveColumns: AppColumn<StaffAttendance>[] = [
    {
      accessorKey: "date",
      header: "Date",
      sortFn: "alphanumeric",
      cell: (info) => formatDate(String(info.getValue())),
    },
    {
      accessorKey: "note",
      header: "Note",
      sortFn: "text",
      cell: (info) => String(info.getValue() || "—"),
    },
  ];
  const performance = [
    ["Present", String(tally.present)],
    ["Late", String(tally.late)],
    ["Leave", String(tally.absent)],
    ["Attendance", tally.rate === null ? "—" : `${tally.rate}%`],
    ["Tests conducted", String(tests)],
  ];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>All recorded days. Attendance counts a present or late day as attended.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-5">
            {performance.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Leave history</CardTitle>
          <CardDescription>Every day marked absent.</CardDescription>
        </CardHeader>
        <CardContent>
          {leave.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave recorded.</p>
          ) : (
            <DataTable data={leave} columns={leaveColumns} searchPlaceholder="Search leave" />
          )}
        </CardContent>
      </Card>
      <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>Days this staff member was marked present, absent, or late.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {level === "write" ? (
          <form
            className="grid gap-3 border-b pb-4 sm:grid-cols-[1fr_10rem_1fr_auto] sm:items-end"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              const result = data.recordStaffAttendance(person.id, values, data.user!.name);
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              toast.success("Attendance marked");
              form.reset({ date: isoDate(new Date()), status: "Present", note: "" });
            })}
          >
            <Field label="Date" error={form.formState.errors.date?.message}>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <OptionSelect value={field.value} onChange={field.onChange} options={ATTENDANCE_MARKS} />
                )}
              />
            </Field>
            <Field label="Note" htmlFor="attendance-note" error={form.formState.errors.note?.message}>
              <Input id="attendance-note" {...form.register("note")} />
            </Field>
            <Button type="submit" className="w-fit">
              Mark
            </Button>
          </form>
        ) : null}
        {person.attendance.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance yet.</p>
        ) : (
          <DataTable
            data={[...person.attendance].sort((a, b) => b.date.localeCompare(a.date))}
            columns={columns}
            searchPlaceholder="Search attendance"
          />
        )}
      </CardContent>
    </Card>
    </div>
  );
}
