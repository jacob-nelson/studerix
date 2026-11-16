"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { OptionSelect } from "@/components/forms/option-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enquirySchema, type EnquiryInput } from "@/lib/schemas";
import { COURSES, ENQUIRY_STATUSES, SOURCES } from "@/lib/types";

const OPEN_STATUSES = ENQUIRY_STATUSES.filter((status) => status !== "Joined");

export function EnquiryForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  defaultValues: EnquiryInput;
  submitLabel: string;
  onSubmit: (values: EnquiryInput) => void;
}) {
  const form = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues,
  });
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Field label="Enquiry date" htmlFor="enquiryDate" error={errors.enquiryDate?.message}>
        <Input id="enquiryDate" type="date" {...form.register("enquiryDate")} aria-invalid={!!errors.enquiryDate} />
      </Field>
      <Field label="Student name" htmlFor="studentName" error={errors.studentName?.message}>
        <Input id="studentName" {...form.register("studentName")} aria-invalid={!!errors.studentName} />
      </Field>
      <Field label="Contact number" htmlFor="contact" error={errors.contact?.message}>
        <Input id="contact" inputMode="numeric" {...form.register("contact")} aria-invalid={!!errors.contact} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" {...form.register("email")} aria-invalid={!!errors.email} />
      </Field>
      <Field label="Source" error={errors.source?.message}>
        <Controller
          control={form.control}
          name="source"
          render={({ field }) => (
            <OptionSelect
              value={field.value}
              onChange={field.onChange}
              options={SOURCES}
              placeholder="Source"
              invalid={!!errors.source}
            />
          )}
        />
      </Field>
      <Field label="Course" error={errors.course?.message}>
        <Controller
          control={form.control}
          name="course"
          render={({ field }) => (
            <OptionSelect
              value={field.value}
              onChange={field.onChange}
              options={COURSES}
              placeholder="Course"
              invalid={!!errors.course}
            />
          )}
        />
      </Field>
      <Field
        label="Status"
        error={errors.status?.message}
        hint="Joined is set from the enquiry itself, so the admission is created with it."
      >
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <OptionSelect
              value={field.value === "Joined" ? "New" : field.value}
              onChange={field.onChange}
              options={OPEN_STATUSES}
              placeholder="Status"
              invalid={!!errors.status}
            />
          )}
        />
      </Field>
      <div className="flex items-end">
        <Controller
          control={form.control}
          name="groupAdded"
          render={({ field }) => (
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="groupAdded"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <Label htmlFor="groupAdded">Added to the batch group</Label>
            </div>
          )}
        />
      </div>
      <Field
        label="Follow-up date"
        htmlFor="followUpDate"
        hint="When someone will contact the student again."
        error={errors.followUpDate?.message}
      >
        <Input id="followUpDate" type="date" {...form.register("followUpDate")} />
      </Field>
      <Field
        label="Next-action date"
        htmlFor="nextActionDate"
        hint="When the planned step should happen, such as a visit or document handover."
        error={errors.nextActionDate?.message}
      >
        <Input id="nextActionDate" type="date" {...form.register("nextActionDate")} />
      </Field>
      <Field
        className="grid gap-1.5 sm:col-span-2"
        label="Next action"
        htmlFor="nextAction"
        error={errors.nextAction?.message}
      >
        <Input id="nextAction" {...form.register("nextAction")} />
      </Field>
      <Field
        className="grid gap-1.5 sm:col-span-2"
        label="Remarks"
        htmlFor="remarks"
        error={errors.remarks?.message}
      >
        <Textarea id="remarks" rows={4} {...form.register("remarks")} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
