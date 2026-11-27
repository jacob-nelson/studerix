"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { HeaderSearch, PageHeader } from "@/components/page-header";
import { PeriodFilter } from "@/components/period-filter";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inPeriod, isoDate, periodBounds, weekdayLabel, type Period } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { accessLevel, canManageCourses } from "@/lib/permissions";
import { scheduleSchema, type ScheduleInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";

interface ClassRow {
  id: string;
  batchId: string;
  courseId: string;
  when: string;
  date: string;
  start: string;
  end: string;
  topic: string;
  batch: string;
  course: string;
}

export function ClassesScreen({ courseId }: { courseId?: string }) {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "courses", data.permissions) : "none";
  const manage = data.user ? canManageCourses(data.user.role, data.permissions) : false;
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const scopedCourse = courseId || (courseFilter === "all" ? "" : courseFilter);
  const batchChoices = data.batches.filter((batch) => !scopedCourse || batch.courseId === scopedCourse);
  const [createBatchId, setCreateBatchId] = useState(batchChoices[0]?.id ?? "");
  const bounds = periodBounds(period, from, to);

  const rows = useMemo<ClassRow[]>(() => {
    return data.batches.flatMap((batch) => {
      if (courseId && batch.courseId !== courseId) return [];
      if (!courseId && courseFilter !== "all" && batch.courseId !== courseFilter) return [];
      if (batchFilter !== "all" && batch.id !== batchFilter) return [];
      const course = data.courses.find((item) => item.id === batch.courseId);
      return batch.schedule
        .filter((slot) => inPeriod(slot.date, bounds.from, bounds.to))
        .map((slot) => ({
          id: slot.id,
          batchId: batch.id,
          courseId: batch.courseId,
          when: `${slot.date} ${slot.start}`,
          date: slot.date,
          start: slot.start,
          end: slot.end,
          topic: slot.topic,
          batch: batch.name,
          course: course?.name ?? "Course",
        }));
    });
  }, [batchFilter, bounds.from, bounds.to, courseFilter, courseId, data.batches, data.courses]);

  const columns = useMemo<AppColumn<ClassRow>[]>(() => {
    const columns: AppColumn<ClassRow>[] = [
      {
        id: "when",
        accessorFn: (row) => row.when,
        header: "When",
        sortFn: "alphanumeric",
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="whitespace-nowrap">
              <span className="block font-medium">{formatDate(row.date)}</span>
              <span className="text-muted-foreground">
                {weekdayLabel(row.date)} {row.start}–{row.end}
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "topic",
        header: "Chapter",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      { accessorKey: "batch", header: "Batch", sortFn: "text" },
    ];
    if (!courseId) columns.push({ accessorKey: "course", header: "Course", sortFn: "text" });
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
              onClick={(event) => {
                event.stopPropagation();
                data.removeClassSlot(info.row.original.batchId, info.row.original.id, actor);
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
  }, [courseId, data, manage]);

  if (!data.user) return null;
  if (level === "none") return <AccessDenied />;

  const courseOptions = [
    { value: "all", label: "All courses" },
    ...data.courses.map((course) => ({ value: course.id, label: course.name })),
  ];
  const batchOptions = [
    { value: "all", label: "All batches" },
    ...batchChoices.map((batch) => ({
      value: batch.id,
      label: courseId ? batch.name : `${data.courses.find((course) => course.id === batch.courseId)?.name ?? "Course"} · ${batch.name}`,
    })),
  ];

  const content = (
    <div className="grid gap-4">
      {manage ? (
        <ClassForm
          batches={batchChoices.map((batch) => ({
            id: batch.id,
            label: courseId
              ? batch.name
              : `${data.courses.find((course) => course.id === batch.courseId)?.name ?? "Course"} · ${batch.name}`,
          }))}
          batchId={batchChoices.some((batch) => batch.id === createBatchId) ? createBatchId : (batchChoices[0]?.id ?? "")}
          onBatchId={setCreateBatchId}
        />
      ) : null}
      <div className="ml-auto flex flex-col items-end gap-3">
        <div className="flex flex-wrap justify-end gap-2">
          {courseId ? (
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chapters or batches"
              aria-label="Search chapters or batches"
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
        </div>
        <PeriodFilter period={period} from={from} to={to} onPeriod={setPeriod} onFrom={setFrom} onTo={setTo} />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        filter={query}
        initialSorting={[{ id: "when", desc: true }]}
        onRowClick={(row) => router.push(`/courses/${row.courseId}/batches/${row.batchId}`)}
      />
    </div>
  );

  if (courseId) return content;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Classes"
        description="Choose a batch to add a class. Filter the list by course, batch, or date."
        actions={<HeaderSearch value={query} onChange={setQuery} placeholder="Search chapters, batches or courses" />}
      />
      {content}
    </div>
  );
}

function ClassForm({
  batches,
  batchId,
  onBatchId,
}: {
  batches: { id: string; label: string }[];
  batchId: string;
  onBatchId: (value: string) => void;
}) {
  const data = useAcademy();
  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { date: isoDate(new Date()), start: "09:30", end: "12:30", topic: "" },
  });
  const errors = form.formState.errors;

  if (batches.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a batch before creating a class.</p>;
  }

  return (
    <form
      className="grid gap-3 border-b pb-4"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        if (!batchId) return;
        const result = data.addClassSlot(batchId, values, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        form.reset({ ...values, topic: "" });
        toast.success("Class added");
      })}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Batch">
          <OptionSelect
            value={batchId}
            onChange={onBatchId}
            options={batches.map((batch) => ({ value: batch.id, label: batch.label }))}
            placeholder="Choose a batch"
          />
        </Field>
        <Field label="Date" error={errors.date?.message}>
          <Controller
            control={form.control}
            name="date"
            render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Field label="Start" htmlFor="classStart" error={errors.start?.message}>
          <Input id="classStart" placeholder="09:30" {...form.register("start")} />
        </Field>
        <Field label="End" htmlFor="classEnd" error={errors.end?.message}>
          <Input id="classEnd" placeholder="12:30" {...form.register("end")} />
        </Field>
      </div>
      <div className="flex flex-wrap items-end justify-end gap-2">
        <Field className="grid min-w-48 flex-1 gap-1.5" label="Chapter" htmlFor="classTopic" error={errors.topic?.message}>
          <Input id="classTopic" placeholder="What is taught" {...form.register("topic")} />
        </Field>
        <Button type="submit" className="w-fit">
          Add class
        </Button>
      </div>
    </form>
  );
}
