"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isoDate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { onBatch, studentForAdmission } from "@/lib/records";
import { testSchema, type TestInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";

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
          Record a mark and a remark for each student, with the teaching staff member who conducted the test.
        </p>
      </div>
      {record ? (
        <TestForm
          key={`${batchId}:${students.map((student) => student.id).join()}:${teachers.map((person) => person.id).join()}`}
          batchId={batchId}
          students={students}
          teachers={teachers.map((person) => ({ id: person.id, name: person.name }))}
        />
      ) : null}
      {tests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tests yet.</p>
      ) : (
        <ul className="grid gap-3">
          {tests.map((test) => {
            const conductor = data.staff.find((person) => person.id === test.staffId);
            return (
              <li key={test.id} className="grid gap-2 rounded-lg bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{test.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(test.conductedOn)}
                      <span className="mx-1.5">·</span>
                      {conductor?.name ?? "Staff"}
                      <span className="mx-1.5">·</span>
                      Out of {test.maxMarks}
                    </p>
                  </div>
                  {record ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-fit"
                      onClick={() => {
                        const result = data.removeTest(test.id, data.user!.name);
                        if (!result.ok) toast.error(result.message);
                        else toast.success("Test removed");
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {test.results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Marks are recorded once the test is conducted.</p>
                ) : (
                <ul className="grid gap-1">
                  {test.results.map((result) => {
                    const admission = data.admissions.find((item) => item.id === result.admissionId);
                    const name = admission ? studentForAdmission(data, admission).name : "Student";
                    return (
                      <li key={result.admissionId} className="flex items-baseline justify-between gap-3 text-sm">
                        <span>
                          <span className="font-medium">{name}</span>
                          {result.remarks ? <span className="ml-2 text-muted-foreground">{result.remarks}</span> : null}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {result.marks}/{test.maxMarks}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TestForm({
  batchId,
  students,
  teachers,
}: {
  batchId: string;
  students: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}) {
  const data = useAcademy();
  const form = useForm<TestInput>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      conductedOn: isoDate(new Date()),
      staffId: teachers[0]?.id ?? "",
      maxMarks: undefined,
      results: students.map((student) => ({ admissionId: student.id, marks: undefined as unknown as number, remarks: "" })),
    },
  });
  const results = useFieldArray({ control: form.control, name: "results" });
  const errors = form.formState.errors;

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">Add students to this batch before recording a test.</p>;
  }
  if (teachers.length === 0) {
    return <p className="text-sm text-muted-foreground">Assign a teaching staff member before recording a test.</p>;
  }

  return (
    <form
      className="grid gap-3 border-b pb-4"
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
          results: students.map((student) => ({ admissionId: student.id, marks: undefined as unknown as number, remarks: "" })),
        });
        toast.success("Test recorded");
      })}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <Input
            id="testMax"
            type="number"
            min={1}
            className={plainNumber}
            {...form.register("maxMarks", { valueAsNumber: true })}
          />
        </Field>
      </div>
      {results.fields.map((field, index) => {
        const student = students.find((item) => item.id === field.admissionId);
        return (
          <div key={field.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1.4fr)] sm:items-end">
            <p className="text-sm font-medium sm:pb-2">{student?.name ?? "Student"}</p>
            <Field label="Mark" htmlFor={`test-mark-${index}`} error={errors.results?.[index]?.marks?.message}>
              <Input
                id={`test-mark-${index}`}
                type="number"
                min={0}
                className={plainNumber}
                {...form.register(`results.${index}.marks`, { valueAsNumber: true })}
              />
            </Field>
            <Field label="Remarks" htmlFor={`test-remarks-${index}`} error={errors.results?.[index]?.remarks?.message}>
              <Input id={`test-remarks-${index}`} {...form.register(`results.${index}.remarks`)} />
            </Field>
          </div>
        );
      })}
      {typeof errors.results?.message === "string" ? <p className="text-xs text-destructive">{errors.results.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" className="w-fit">
          Save test
        </Button>
      </div>
    </form>
  );
}
