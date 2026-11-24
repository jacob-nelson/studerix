"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { consultancySchema, type ConsultancyInput } from "@/lib/schemas";
import { CONSULTANCY_STATUSES } from "@/lib/types";

export function CandidateForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  defaultValues: ConsultancyInput;
  submitLabel: string;
  onSubmit: (values: ConsultancyInput) => void;
}) {
  const form = useForm<ConsultancyInput>({
    resolver: zodResolver(consultancySchema),
    defaultValues,
  });
  const errors = form.formState.errors;

  return (
    <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" {...form.register("name")} />
      </Field>
      <Field label="Contact" htmlFor="contact" error={errors.contact?.message}>
        <Input id="contact" inputMode="numeric" {...form.register("contact")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" {...form.register("email")} />
      </Field>
      <Field label="Progress" error={errors.progress?.message}>
        <Controller
          control={form.control}
          name="progress"
          render={({ field }) => (
            <OptionSelect value={field.value} onChange={field.onChange} options={CONSULTANCY_STATUSES} />
          )}
        />
      </Field>
      <Field label="Company" htmlFor="company">
        <Input id="company" {...form.register("company")} />
      </Field>
      <Field label="Salary" htmlFor="salary">
        <Input id="salary" placeholder="5.5 LPA" {...form.register("salary")} />
      </Field>
      <Field label="Agreed fee" htmlFor="agreedFee" error={errors.agreedFee?.message}>
        <Input
          id="agreedFee"
          type="number"
          min={0}
          {...form.register("agreedFee", { valueAsNumber: true })}
          className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </Field>
      <Field label="Date added" error={errors.addedOn?.message}>
        <Controller
          control={form.control}
          name="addedOn"
          render={({ field }) => (
            <DateField
              id="addedOn"
              label="Date added"
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.addedOn}
            />
          )}
        />
      </Field>
      <Field className="grid gap-1.5 sm:col-span-2" label="Notes" htmlFor="notes">
        <Textarea id="notes" rows={4} {...form.register("notes")} />
      </Field>
      <div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
