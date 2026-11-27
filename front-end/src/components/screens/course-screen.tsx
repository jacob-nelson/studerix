"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { BatchTests } from "@/components/screens/batch-tests";
import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addWeeks, isoDate, weekdayLabel } from "@/lib/dates";
import { formatDate, formatInr } from "@/lib/format";
import { canManageAdmissions, canManageCourses } from "@/lib/permissions";
import { onBatch, scheduleAmounts, studentForAdmission } from "@/lib/records";
import {
  batchSchema,
  courseSchema,
  feePlanSchema,
  scheduleSchema,
  syllabusSchema,
  type BatchInput,
  type CourseInput,
  type FeePlanInput,
  type ScheduleInput,
  type SyllabusInput,
} from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import type { Admission, ClassSlot, CourseOffering } from "@/lib/types";

const plainNumber =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function useCourseSection(id: string) {
  const data = useAcademy();
  const course = data.courses.find((item) => item.id === id);
  const manage = data.user ? canManageCourses(data.user.role, data.permissions) : false;
  return { data, course, manage };
}

export function CourseDetails({ id }: { id: string }) {
  const { data, course, manage } = useCourseSection(id);
  if (!course || !data.user) return null;

  return (
      <Card>
        <CardHeader>
          <CardTitle>Duration and fee</CardTitle>
          <CardDescription>
            {course.durationWeeks} weeks · {formatInr(course.fee)}
            {course.opensPlacement ? " · Joining opens an internal placement." : ""}
          </CardDescription>
        </CardHeader>
        {manage ? (
          <CardContent>
            <CourseEditor course={course} />
          </CardContent>
        ) : null}
      </Card>
  );
}

export function CourseFees({ id }: { id: string }) {
  const { data, course, manage } = useCourseSection(id);
  if (!course || !data.user) return null;

  return (
      <Card>
        <CardHeader>
          <CardTitle>Fee plans</CardTitle>
          <CardDescription>
            How this course fee is collected. Each instalment has its own due date, and the parts add up to 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {manage ? <FeePlanForm courseId={course.id} /> : null}
          {course.feePlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee plans yet.</p>
          ) : (
            <ul className="grid gap-3">
              {course.feePlans.map((plan) => (
                <li key={plan.id} className="grid gap-2 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{plan.name}</p>
                    {manage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-fit"
                        onClick={() => {
                          data.removeFeePlan(course.id, plan.id, data.user!.name);
                          toast.success("Fee plan removed");
                        }}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <ul className="grid gap-1">
                    {scheduleAmounts(course.fee, plan.parts).map((part) => (
                      <li key={`${plan.id}-${part.label}-${part.percent}`} className="flex items-center justify-between gap-3 text-sm">
                        <span>
                          {part.label}
                          <span className="ml-2 text-muted-foreground">{part.percent}%</span>
                          <span className="ml-2 text-muted-foreground">Due {formatDate(part.dueOn)}</span>
                        </span>
                        <span className="tabular-nums">{formatInr(part.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
  );
}

export function CourseSyllabus({ id }: { id: string }) {
  const { data, course, manage } = useCourseSection(id);
  if (!course || !data.user) return null;

  return (
      <Card>
        <CardHeader>
          <CardTitle>Syllabus</CardTitle>
          <CardDescription>Topics taught on this course, with the hours set aside for each.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {course.syllabus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics yet.</p>
          ) : (
            <ul className="grid gap-2">
              {course.syllabus.map((topic) => (
                <li key={topic.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{topic.title}</span>
                    <span className="ml-2 text-muted-foreground">{topic.hours} hrs</span>
                  </span>
                  {manage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-fit"
                      onClick={() => {
                        data.removeSyllabusTopic(course.id, topic.id, data.user!.name);
                        toast.success("Topic removed");
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {manage ? <SyllabusForm courseId={course.id} /> : null}
        </CardContent>
      </Card>
  );
}

export function CourseBatches({ id }: { id: string }) {
  const { data, course, manage } = useCourseSection(id);
  const batches = data.batches.filter((batch) => batch.courseId === id);
  if (!course || !data.user) return null;

  return (
      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>
            Open a batch for its staff and students. Classes and tests for this course are on their own pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {manage ? <BatchForm courseId={course.id} durationWeeks={course.durationWeeks} /> : null}
          {batches.length === 0 ? <p className="text-sm text-muted-foreground">No batch yet.</p> : null}
          {batches.map((batch) => {
            const students = data.admissions.filter((admission) => onBatch(admission, batch.id)).length;
            const staff = batch.staffIds.length;
            return (
              <Link
                key={batch.id}
                href={`/courses/${course.id}/batches/${batch.id}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5 hover:bg-muted"
              >
                <span>
                  <span className="block font-medium">{batch.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(batch.startsOn)} – {formatDate(batch.endsOn)}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {batch.schedule.length} {batch.schedule.length === 1 ? "class" : "classes"}
                    <span className="mx-1.5">·</span>
                    {staff} staff
                    <span className="mx-1.5">·</span>
                    {students} {students === 1 ? "student" : "students"}
                  </span>
                  <ChevronRight className="size-4" />
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
  );
}

interface BatchStudentRow {
  id: string;
  name: string;
  status: Admission["status"];
}

export function CourseBatch({ id, batchId }: { id: string; batchId: string }) {
  const router = useRouter();
  const { data, course, manage } = useCourseSection(id);
  const batch = data.batches.find((item) => item.id === batchId && item.courseId === id);
  const canAttach = data.user ? canManageAdmissions(data.user.role, data.permissions) : false;

  const students = useMemo<BatchStudentRow[]>(() => {
    if (!batch) return [];
    return data.admissions
      .filter((admission) => onBatch(admission, batch.id))
      .map((admission) => ({
        id: admission.id,
        name: studentForAdmission(data, admission).name,
        status: admission.status,
      }));
  }, [batch, data]);

  const classColumns = useMemo<AppColumn<ClassSlot>[]>(() => {
    const columns: AppColumn<ClassSlot>[] = [
      {
        id: "when",
        accessorFn: (slot) => `${slot.date} ${slot.start}`,
        header: "When",
        sortFn: "alphanumeric",
        cell: (info) => {
          const slot = info.row.original;
          return (
            <span className="whitespace-nowrap">
              <span className="block font-medium">{formatDate(slot.date)}</span>
              <span className="text-muted-foreground">
                {weekdayLabel(slot.date)} {slot.start}–{slot.end}
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "topic",
        header: "Chapter",
        sortFn: "text",
      },
    ];
    if (manage && data.user) {
      const actor = data.user.name;
      columns.push({
        id: "remove",
        header: "",
        enableSorting: false,
        cell: (info) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() => {
                data.removeClassSlot(batchId, info.row.original.id, actor);
                toast.success("Class removed");
              }}
            >
              Remove
            </Button>
          </div>
        ),
      });
    }
    return columns;
  }, [batchId, data, manage]);

  const studentColumns = useMemo<AppColumn<BatchStudentRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Student",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
    ],
    [],
  );

  if (!course || !data.user) return null;
  if (!batch) return <MissingRecord href={`/courses/${id}/batches`} label="Back to batches" />;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl">{batch.name}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(batch.startsOn)} – {formatDate(batch.endsOn)}
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href={`/courses/${id}/batches`}>All batches</Link>
        </Button>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          <section className="grid gap-3">
            <div>
              <h3 className="font-medium">Staff</h3>
              <p className="text-sm text-muted-foreground">
                Assign one or more teaching or non-teaching staff to this batch.
              </p>
            </div>
            {batch.staffIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff on this batch yet.</p>
            ) : (
              <ul className="grid gap-2">
                {batch.staffIds.map((staffId) => {
                  const person = data.staff.find((item) => item.id === staffId);
                  if (!person) return null;
                  return (
                    <li key={person.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{person.name}</span>
                      <span className="flex items-center gap-2">
                        <StatusBadge value={person.kind} />
                        {person.active ? null : <StatusBadge value="Inactive" />}
                        {manage ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-fit"
                            onClick={() => {
                              const result = data.removeBatchStaff(batch.id, person.id, data.user!.name);
                              if (!result.ok) toast.error(result.message);
                              else toast.success(`${person.name} removed from this batch`);
                            }}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {manage ? <AssignStaff batchId={batch.id} assignedIds={batch.staffIds} /> : null}
          </section>
          <section className="grid gap-3">
            <div>
              <h3 className="font-medium">Students</h3>
              <p className="text-sm text-muted-foreground">
                {students.length} {students.length === 1 ? "student" : "students"} on this batch.
              </p>
            </div>
            {canAttach ? <AttachStudent batchId={batch.id} /> : null}
            <DataTable
              data={students}
              columns={studentColumns}
              searchPlaceholder="Search students"
              searchAlign="end"
              pageSize={8}
              initialSorting={[{ id: "name", desc: false }]}
              onRowClick={(row) => router.push(`/admissions/${row.id}`)}
            />
          </section>
        </div>
        <section className="grid gap-3">
          <div>
            <h3 className="font-medium">Classes</h3>
            <p className="text-sm text-muted-foreground">
              {batch.schedule.length} {batch.schedule.length === 1 ? "chapter" : "chapters"} on this batch.
            </p>
          </div>
          {manage ? <ScheduleForm batchId={batch.id} /> : null}
          <DataTable
            data={batch.schedule}
            columns={classColumns}
            searchPlaceholder="Search chapters"
            searchAlign="end"
            pageSize={8}
            initialSorting={[{ id: "when", desc: false }]}
          />
        </section>
      </div>
      <BatchTests batchId={batch.id} record={canAttach} />
    </div>
  );
}

function CourseEditor({ course }: { course: CourseOffering }) {
  const data = useAcademy();
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course.name,
      durationWeeks: course.durationWeeks,
      fee: course.fee,
      summary: course.summary,
      opensPlacement: course.opensPlacement,
    },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.updateCourse(course, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Course updated");
      })}
    >
      <Field label="Name" htmlFor="editName" error={errors.name?.message}>
        <Input id="editName" {...form.register("name")} />
      </Field>
      <Field label="Duration in weeks" htmlFor="editWeeks" error={errors.durationWeeks?.message}>
        <Input
          id="editWeeks"
          type="number"
          min={1}
          className={plainNumber}
          {...form.register("durationWeeks", { valueAsNumber: true })}
        />
      </Field>
      <Field label="Course fee" htmlFor="editFee" error={errors.fee?.message}>
        <Input
          id="editFee"
          type="number"
          min={1}
          className={plainNumber}
          {...form.register("fee", { valueAsNumber: true })}
        />
      </Field>
      <Controller
        control={form.control}
        name="opensPlacement"
        render={({ field }) => (
          <div className="flex items-end">
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="editPlacement"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <Label htmlFor="editPlacement">Opens an internal placement</Label>
            </div>
          </div>
        )}
      />
      <Field className="grid gap-1.5 sm:col-span-2" label="Summary" htmlFor="editSummary" error={errors.summary?.message}>
        <Textarea id="editSummary" rows={2} {...form.register("summary")} />
      </Field>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" className="w-fit">
          Save course
        </Button>
      </div>
    </form>
  );
}

function FeePlanForm({ courseId }: { courseId: string }) {
  const data = useAcademy();
  const form = useForm<FeePlanInput>({
    resolver: zodResolver(feePlanSchema),
    defaultValues: { name: "", parts: [{ label: "On joining", percent: 100, dueOn: "" }] },
  });
  const parts = useFieldArray({ control: form.control, name: "parts" });
  const watched = form.watch("parts");
  const total = watched.reduce((sum, part) => sum + (Number.isFinite(part.percent) ? part.percent : 0), 0);
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-3 border-b pb-4"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.addFeePlan(courseId, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        form.reset({ name: "", parts: [{ label: "On joining", percent: 100, dueOn: "" }] });
        toast.success("Fee plan added");
      })}
    >
      <p className="text-sm font-medium">Add a plan</p>
      <Field label="Plan name" htmlFor="planName" error={errors.name?.message}>
        <Input id="planName" placeholder="50% in advance" {...form.register("name")} />
      </Field>
      {parts.fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_7rem_11rem_auto] sm:items-end">
          <Field label={index === 0 ? "Part" : `Part ${index + 1}`} htmlFor={`plan-label-${index}`} error={errors.parts?.[index]?.label?.message}>
            <Input id={`plan-label-${index}`} placeholder="On joining" {...form.register(`parts.${index}.label`)} />
          </Field>
          <Field label="Percent" htmlFor={`plan-percent-${index}`} error={errors.parts?.[index]?.percent?.message}>
            <Input
              id={`plan-percent-${index}`}
              type="number"
              min={1}
              max={100}
              className={plainNumber}
              {...form.register(`parts.${index}.percent`, { valueAsNumber: true })}
            />
          </Field>
          <Field label="Due date" error={errors.parts?.[index]?.dueOn?.message}>
            <Controller
              control={form.control}
              name={`parts.${index}.dueOn`}
              render={({ field: dueField }) => (
                <DateField label="Due date" value={dueField.value} onChange={dueField.onChange} />
              )}
            />
          </Field>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-fit"
            disabled={parts.fields.length === 1}
            onClick={() => parts.remove(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-fit"
          disabled={parts.fields.length >= 6}
          onClick={() => parts.append({ label: "", percent: 0, dueOn: "" })}
        >
          Add part
        </Button>
        <p className="text-xs text-muted-foreground">Adds up to {total}%</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="w-fit">
          Save plan
        </Button>
      </div>
    </form>
  );
}

function SyllabusForm({ courseId }: { courseId: string }) {
  const data = useAcademy();
  const form = useForm<SyllabusInput>({
    resolver: zodResolver(syllabusSchema),
    defaultValues: { title: "", hours: undefined },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.addSyllabusTopic(courseId, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        form.reset({ title: "", hours: undefined });
        toast.success("Topic added");
      })}
    >
      <Field label="Topic" htmlFor="topicTitle" error={errors.title?.message}>
        <Input id="topicTitle" {...form.register("title")} />
      </Field>
      <Field label="Hours" htmlFor="topicHours" error={errors.hours?.message}>
        <Input
          id="topicHours"
          type="number"
          min={1}
          className={plainNumber}
          {...form.register("hours", { valueAsNumber: true })}
        />
      </Field>
      <Button type="submit" className="w-fit">
        Add topic
      </Button>
    </form>
  );
}

function ScheduleForm({ batchId }: { batchId: string }) {
  const data = useAcademy();
  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { date: isoDate(new Date()), start: "09:30", end: "12:30", topic: "" },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-3 border-b pb-4"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.addClassSlot(batchId, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        form.reset({ ...values, topic: "" });
        toast.success("Class added to this batch");
      })}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Date" error={errors.date?.message}>
          <Controller
            control={form.control}
            name="date"
            render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Field label="Start" htmlFor={`slotStart-${batchId}`} error={errors.start?.message}>
          <Input id={`slotStart-${batchId}`} placeholder="09:30" {...form.register("start")} />
        </Field>
        <Field label="End" htmlFor={`slotEnd-${batchId}`} error={errors.end?.message}>
          <Input id={`slotEnd-${batchId}`} placeholder="12:30" {...form.register("end")} />
        </Field>
      </div>
      <div className="flex flex-wrap items-end justify-end gap-2">
        <Field className="grid min-w-48 flex-1 gap-1.5" label="Chapter" htmlFor={`slotTopic-${batchId}`} error={errors.topic?.message}>
          <Input id={`slotTopic-${batchId}`} placeholder="What is taught" {...form.register("topic")} />
        </Field>
        <Button type="submit" className="w-fit">
          Add class
        </Button>
      </div>
    </form>
  );
}

export function BatchForm({ courseId, durationWeeks }: { courseId: string; durationWeeks: number }) {
  const data = useAcademy();
  const start = isoDate(new Date());
  const form = useForm<BatchInput>({
    resolver: zodResolver(batchSchema),
    defaultValues: { name: "", startsOn: start, endsOn: addWeeks(start, durationWeeks) },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-3 border-b pb-4"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const result = data.addBatch(courseId, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        form.reset({ name: "", startsOn: values.startsOn, endsOn: values.endsOn });
        toast.success("Batch attached to this course");
      })}
    >
      <p className="text-sm font-medium">Attach a batch</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Batch name" htmlFor="batchName" error={errors.name?.message}>
          <Input id="batchName" placeholder="ST-Jan-2027" {...form.register("name")} />
        </Field>
        <Field label="Starts" error={errors.startsOn?.message}>
          <Controller
            control={form.control}
            name="startsOn"
            render={({ field }) => (
              <DateField
                label="Starts"
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  form.setValue("endsOn", addWeeks(value, durationWeeks));
                }}
              />
            )}
          />
        </Field>
        <Field label="Ends" error={errors.endsOn?.message}>
          <Controller
            control={form.control}
            name="endsOn"
            render={({ field }) => (
              <DateField label="Ends" value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="w-fit">
          Add batch
        </Button>
      </div>
    </form>
  );
}

function AssignStaff({ batchId, assignedIds }: { batchId: string; assignedIds: string[] }) {
  const data = useAcademy();
  const [staffId, setStaffId] = useState("");
  const options = data.staff
    .filter((person) => person.active && !assignedIds.includes(person.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((person) => ({
      value: person.id,
      label: `${person.name} · ${person.kind}`,
    }));

  return (
    <form
      className="flex flex-wrap items-end justify-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!staffId) return;
        const result = data.assignBatchStaff(batchId, staffId, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setStaffId("");
        toast.success("Staff assigned to this batch");
      }}
    >
      <div className="min-w-56 flex-1">
        <OptionSelect
          value={staffId}
          onChange={setStaffId}
          options={options}
          placeholder={options.length ? "Assign a staff member" : "Everyone active is already assigned"}
          disabled={options.length === 0}
        />
      </div>
      <Button type="submit" className="w-fit" disabled={!staffId}>
        Assign
      </Button>
    </form>
  );
}

function AttachStudent({ batchId }: { batchId: string }) {
  const data = useAcademy();
  const [admissionId, setAdmissionId] = useState("");
  const options = data.admissions
    .filter((admission) => !onBatch(admission, batchId) && admission.status !== "Discontinued")
    .map((admission) => ({
      value: admission.id,
      label: `${studentForAdmission(data, admission).name} · ${admission.batch || "No batch"}`,
    }));

  return (
    <form
      className="flex flex-wrap items-end justify-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!admissionId) return;
        const result = data.assignAdmissionBatch(admissionId, batchId, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setAdmissionId("");
        toast.success(`Student attached to this batch`);
      }}
    >
      <div className="min-w-56 flex-1">
        <OptionSelect
          value={admissionId}
          onChange={setAdmissionId}
          options={options}
          placeholder={options.length ? "Attach a student" : "No other students to attach"}
          disabled={options.length === 0}
        />
      </div>
      <Button type="submit" className="w-fit" disabled={!admissionId}>
        Attach
      </Button>
    </form>
  );
}
