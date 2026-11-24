"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ledgerSchema, type LedgerInput } from "@/lib/schemas";
import { PAYMENT_MODES } from "@/lib/types";
import { isoDate } from "@/lib/dates";

export function LedgerForm({
  balance,
  paid,
  onSubmit,
}: {
  balance: number;
  paid: number;
  onSubmit: (values: LedgerInput) => void;
}) {
  const schema = ledgerSchema(balance, paid);
  const form = useForm<LedgerInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: "payment",
      amount: undefined,
      date: isoDate(new Date()),
      mode: "UPI",
      note: "",
    },
  });
  const errors = form.formState.errors;

  return (
    <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Entry" error={errors.kind?.message}>
          <Controller
            control={form.control}
            name="kind"
            render={({ field }) => (
              <OptionSelect
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "payment", label: "Payment" },
                  { value: "refund", label: "Refund" },
                ]}
              />
            )}
          />
        </Field>
        <Field label="Mode" error={errors.mode?.message}>
          <Controller
            control={form.control}
            name="mode"
            render={({ field }) => (
              <OptionSelect
                value={field.value}
                onChange={field.onChange}
                options={PAYMENT_MODES}
                invalid={!!errors.mode}
              />
            )}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" htmlFor="amount" error={errors.amount?.message}>
          <Input
            id="amount"
            type="number"
            min={1}
            {...form.register("amount", { valueAsNumber: true })}
            aria-invalid={!!errors.amount}
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </Field>
        <Field label="Date" error={errors.date?.message}>
          <Controller
            control={form.control}
            name="date"
            render={({ field }) => (
              <DateField
                id="ledgerDate"
                label="Date"
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.date}
              />
            )}
          />
        </Field>
      </div>
      <Field label="Note" htmlFor="note" error={errors.note?.message}>
        <Input id="note" {...form.register("note")} />
      </Field>
      <Button type="submit">Save entry</Button>
    </form>
  );
}
