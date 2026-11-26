"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { isoDate } from "@/lib/dates";
import { accessLevel } from "@/lib/permissions";
import { staffAttendanceSchema, type StaffAttendanceInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { ATTENDANCE_MARKS, type StaffAttendance } from "@/lib/types";

export function StaffProfileScreen({ id }: { id: string }) {
  const data = useAcademy();
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";
  const person = data.staff.find((item) => item.id === id);
  const form = useForm<StaffAttendanceInput>({
    resolver: zodResolver(staffAttendanceSchema),
    defaultValues: { date: isoDate(new Date()), status: "Present", note: "" },
  });

  if (level === "none" || !data.user) return <AccessDenied />;
  if (!person) {
    return (
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <PageHeader eyebrow="People" title="Staff member not found" />
        <Button asChild variant="outline" className="w-fit">
          <Link href="/staff">Back to staff</Link>
        </Button>
      </div>
    );
  }

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

  const facts = [
    ["Contact", person.contact],
    ["Email", person.email],
    ["Gender", person.gender || "—"],
    ["Blood group", person.bloodGroup || "—"],
    ["Address", person.address || "—"],
    ["Qualifications", person.qualifications.join(", ") || "—"],
    ["Joined", person.joinedOn ? formatDate(person.joinedOn) : "—"],
    ["Relieved", person.relievedOn ? formatDate(person.relievedOn) : "—"],
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow={person.id}
        title={person.name}
        description={`${person.kind} · ${person.role}`}
        leading={
          person.photo ? (
            <img src={person.photo} alt="" className="size-16 rounded-lg object-cover" />
          ) : null
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/staff">Back to staff</Link>
          </Button>
        }
      />
      <div className="flex gap-2">
        <StatusBadge value={person.kind} />
        <StatusBadge value={person.active ? "Active" : "Inactive"} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className={label === "Address" || label === "Qualifications" ? "sm:col-span-2" : undefined}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
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
            <DataTable data={[...person.attendance].sort((a, b) => b.date.localeCompare(a.date))} columns={columns} searchPlaceholder="Search attendance" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
