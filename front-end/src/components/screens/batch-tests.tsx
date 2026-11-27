"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { onBatch, studentForAdmission, testMarkLabel } from "@/lib/records";
import {
  testMarksSchema,
  testRemarksSchema,
  testScheduleSchema,
  testSchema,
  type TestInput,
  type TestMarksInput,
  type TestRemarksInput,
  type TestScheduleInput,
} from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import type { BatchTest } from "@/lib/types";

const plainNumber =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function BatchTests({
  batchId,
  record,
}: {
  batchId: string;
  record: boolean;
}) {
  const data = useAcademy();
  const [panel, setPanel] = useState<{ id: string; mode: "marks" | "reschedule" | "remarks" } | null>(null);
  const batch = data.batches.find((item) => item.id === batchId);
  const students = data.admissions
    .filter((admission) => onBatch(admission, batchId))
    .map((admission) => ({ id: admission.id, name: studentForAdmission(data, admission).name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const teachers = (batch?.staffIds ?? []).flatMap((staffId) => {
    const person = data.staff.find((item) => item.id === staffId);
    return person && person.kind === "Teaching" && person.active ? [person] : [];
  });
  const tests = data.tests
    .filter((test) => test.batchId === batchId)
    .sort((a, b) => b.conductedOn.localeCompare(a.conductedOn) || b.id.localeCompare(a.id));

  return (
    <section className="grid gap-3">
      <div>
        <h3 className="font-medium">Tests</h3>
        <p className="text-sm text-muted-foreground">
          Add a test for a past, current, or future date. Marks and absences can be entered or changed afterwards.
        </p>
      </div>
      {record ? (
        <TestForm
          key={`${batchId}:${teachers.map((person) => person.id).join()}`}
          batchId={batchId}
          teachers={teachers.map((person) => ({ id: person.id, name: person.name }))}
        />
      ) : null}
      {tests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tests yet.</p>
      ) : (
        <ul className="grid gap-3">
          {tests.map((test) => {
            const conductor = data.staff.find((person) => person.id === test.staffId);
            const open = panel?.id === test.id ? panel.mode : null;
            const cancelled = test.status === "cancelled";
            return (
              <li key={test.id} className="grid gap-3 rounded-lg bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{test.title}</p>
                      {cancelled ? <StatusBadge value="Cancelled" /> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(test.conductedOn)}
                      <span className="mx-1.5">·</span>
                      {conductor?.name ?? "Staff"}
                      <span className="mx-1.5">·</span>
                      Out of {test.maxMarks}
                    </p>
                  </div>
                  {record ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      {open ? null : (
                        <>
                          {cancelled ? null : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="w-fit"
                              onClick={() => setPanel({ id: test.id, mode: "marks" })}
                            >
                              Marks
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-fit"
                            onClick={() => setPanel({ id: test.id, mode: "reschedule" })}
                          >
                            Reschedule
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-fit"
                            onClick={() => setPanel({ id: test.id, mode: "remarks" })}
                          >
                            Remarks
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-fit"
                            onClick={() => {
                              const result = data.setTestCancelled(test.id, !cancelled, data.user!.name);
                              if (!result.ok) toast.error(result.message);
                              else toast.success(cancelled ? "Test restored" : "Test cancelled");
                            }}
                          >
                            {cancelled ? "Restore" : "Cancel test"}
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-fit"
                        onClick={() => {
                          const result = data.removeTest(test.id, data.user!.name);
                          if (!result.ok) toast.error(result.message);
                          else {
                            if (panel?.id === test.id) setPanel(null);
                            toast.success("Test removed");
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </div>
                {test.remarks && open !== "remarks" ? (
                  <p className="text-sm text-muted-foreground">{test.remarks}</p>
                ) : null}
                {open === "reschedule" ? (
                  <RescheduleForm test={test} cancelled={cancelled} onClose={() => setPanel(null)} />
                ) : null}
                {open === "remarks" ? <RemarksForm test={test} onClose={() => setPanel(null)} /> : null}
                {open === "marks" ? (
                  <MarksForm
                    key={`${test.id}:${students.map((student) => student.id).join()}`}
                    test={test}
                    students={students}
                    onClose={() => setPanel(null)}
                  />
                ) : (
                  <TestMarks test={test} students={students} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TestMarks({
  test,
  students,
}: {
  test: BatchTest;
  students: { id: string; name: string }[];
}) {
  const recorded = new Map(test.results.map((result) => [result.admissionId, result]));
  const rows = [
    ...students.map((student) => ({ id: student.id, name: student.name, result: recorded.get(student.id) ?? null })),
    ...test.results
      .filter((result) => !students.some((student) => student.id === result.admissionId))
      .map((result) => ({ id: result.admissionId, name: "Former student", result })),
  ];

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Add students to this batch before entering marks.</p>;
  }

  return (
    <ul className="grid gap-1">
      {rows.map((row) => (
        <li key={row.id} className="flex items-baseline justify-between gap-3 text-sm">
          <span>
            <span className="font-medium">{row.name}</span>
            {row.result?.remarks ? <span className="ml-2 text-muted-foreground">{row.result.remarks}</span> : null}
          </span>
          <span className="shrink-0 tabular-nums">{testMarkLabel(row.result, test.maxMarks)}</span>
        </li>
      ))}
    </ul>
  );
}

export function TestForm({
  batchId,
  teachers,
  embedded = false,
  onCreated,
}: {
  batchId: string;
  teachers: { id: string; name: string }[];
  embedded?: boolean;
  onCreated?: () => void;
}) {
  const data = useAcademy();
  const form = useForm<TestInput>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      conductedOn: isoDate(new Date()),
      staffId: teachers[0]?.id ?? "",
      maxMarks: undefined,
    },
  });
  const errors = form.formState.errors;

  if (teachers.length === 0) {
    return <p className="text-sm text-muted-foreground">Assign a teaching staff member before adding a test.</p>;
  }

  return (
    <form
      className={embedded ? "grid gap-4" : "grid gap-3 border-b pb-4"}
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.recordTest(batchId, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        form.reset({
          title: "",
          conductedOn: isoDate(new Date()),
          staffId: teachers[0]?.id ?? "",
          maxMarks: undefined,
        });
        toast.success("Test added");
        onCreated?.();
      })}
    >
      <div className={embedded ? "grid gap-4" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"}>
        <Field label="Test name" htmlFor="testTitle" error={errors.title?.message}>
          <Input id="testTitle" placeholder="Week 4 mock" {...form.register("title")} />
        </Field>
        <Field label="Date" error={errors.conductedOn?.message}>
          <Controller
            control={form.control}
            name="conductedOn"
            render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Field label="Conducted by" error={errors.staffId?.message}>
          <Controller
            control={form.control}
            name="staffId"
            render={({ field }) => (
              <OptionSelect
                value={field.value}
                onChange={field.onChange}
                options={teachers.map((person) => ({ value: person.id, label: person.name }))}
                placeholder="Teaching staff"
              />
            )}
          />
        </Field>
        <Field label="Maximum" htmlFor="testMax" error={errors.maxMarks?.message}>
          <Controller
            control={form.control}
            name="maxMarks"
            render={({ field }) => (
              <Input
                id="testMax"
                type="number"
                min={1}
                className={plainNumber}
                value={field.value ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  field.onChange(raw === "" ? undefined : Number(raw));
                }}
              />
            )}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="w-fit">
          Add test
        </Button>
      </div>
    </form>
  );
}

function MarksForm({
  test,
  students,
  onClose,
}: {
  test: BatchTest;
  students: { id: string; name: string }[];
  onClose: () => void;
}) {
  const data = useAcademy();
  const recorded = new Map(test.results.map((result) => [result.admissionId, result]));
  const form = useForm<TestMarksInput>({
    resolver: zodResolver(testMarksSchema),
    defaultValues: {
      maxMarks: test.maxMarks,
      results: students.map((student) => {
        const existing = recorded.get(student.id);
        return {
          admissionId: student.id,
          absent: existing?.absent ?? false,
          marks: existing?.absent ? null : (existing?.marks ?? null),
          remarks: existing?.remarks ?? "",
        };
      }),
    },
  });
  const results = useFieldArray({ control: form.control, name: "results" });
  const watched = form.watch("results");
  const errors = form.formState.errors;

  if (students.length === 0) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">Add students to this batch before entering marks.</p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.updateTestMarks(test.id, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Marks saved");
        onClose();
      })}
    >
      {results.fields.map((field, index) => {
        const student = students.find((item) => item.id === field.admissionId);
        return (
          <div
            key={field.id}
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_6rem_minmax(0,1.4fr)] sm:items-end"
          >
            <p className="text-sm font-medium sm:pb-2">{student?.name ?? "Student"}</p>
            <Controller
              control={form.control}
              name={`results.${index}.absent`}
              render={({ field: absent }) => (
                <label className="flex items-center gap-2 text-sm sm:pb-2">
                  <Checkbox
                    checked={absent.value}
                    onCheckedChange={(checked) => {
                      const next = checked === true;
                      absent.onChange(next);
                      if (next) form.setValue(`results.${index}.marks`, null, { shouldValidate: true });
                    }}
                    aria-label={`Mark ${student?.name ?? "student"} absent`}
                  />
                  Absent
                </label>
              )}
            />
            <Field label="Mark" htmlFor={`test-mark-${test.id}-${index}`} error={errors.results?.[index]?.marks?.message}>
              <Controller
                control={form.control}
                name={`results.${index}.marks`}
                render={({ field: mark }) => (
                  <Input
                    id={`test-mark-${test.id}-${index}`}
                    type="number"
                    min={0}
                    className={plainNumber}
                    disabled={watched[index]?.absent}
                    value={watched[index]?.absent ? "" : (mark.value ?? "")}
                    onChange={(event) => {
                      const raw = event.target.value;
                      mark.onChange(raw === "" ? null : Number(raw));
                    }}
                  />
                )}
              />
            </Field>
            <Field
              label="Remarks"
              htmlFor={`test-remarks-${test.id}-${index}`}
              error={errors.results?.[index]?.remarks?.message}
            >
              <Input id={`test-remarks-${test.id}-${index}`} {...form.register(`results.${index}.remarks`)} />
            </Field>
          </div>
        );
      })}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="w-fit">
          Save marks
        </Button>
      </div>
    </form>
  );
}

function RescheduleForm({
  test,
  cancelled,
  onClose,
}: {
  test: BatchTest;
  cancelled: boolean;
  onClose: () => void;
}) {
  const data = useAcademy();
  const form = useForm<TestScheduleInput>({
    resolver: zodResolver(testScheduleSchema),
    defaultValues: { conductedOn: test.conductedOn },
  });

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.rescheduleTest(test.id, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Test rescheduled");
        onClose();
      })}
    >
      {cancelled ? (
        <p className="text-sm text-muted-foreground">Saving a new date puts this test back on the schedule.</p>
      ) : null}
      <Field label="New date" error={form.formState.errors.conductedOn?.message} className="max-w-xs">
        <Controller
          control={form.control}
          name="conductedOn"
          render={({ field }) => <DateField label="New date" value={field.value} onChange={field.onChange} />}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="w-fit">
          Save date
        </Button>
      </div>
    </form>
  );
}

function RemarksForm({ test, onClose }: { test: BatchTest; onClose: () => void }) {
  const data = useAcademy();
  const form = useForm<TestRemarksInput>({
    resolver: zodResolver(testRemarksSchema),
    defaultValues: { remarks: test.remarks },
  });

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.updateTestRemarks(test.id, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Remarks saved");
        onClose();
      })}
    >
      <Field label="Remarks" htmlFor={`test-note-${test.id}`} error={form.formState.errors.remarks?.message}>
        <Textarea
          id={`test-note-${test.id}`}
          placeholder="Why the date changed, or anything the batch should remember"
          {...form.register("remarks")}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="w-fit">
          Save remarks
        </Button>
      </div>
    </form>
  );
}
