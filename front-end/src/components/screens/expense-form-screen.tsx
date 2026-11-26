"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { BillDropzone } from "@/components/forms/bill-dropzone";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/lib/dates";
import { accessLevel } from "@/lib/permissions";
import { expenseSchema, type ExpenseInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";

export function ExpenseFormScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "expenses", data.permissions) : "none";
  const staff = data.staff.filter((user) => user.active).map((user) => user.name);
  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: isoDate(new Date()),
      purpose: "",
      amount: undefined,
      debitedBy: data.user?.name ?? "",
      invoiceNumber: "",
      notes: "",
      bills: [],
    },
  });

  if (level !== "write" || !data.user) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <PageHeader
        eyebrow="Expenses"
        title="New expense"
        actions={
          <Button asChild variant="outline">
            <Link href="/expenses">Back to expenses</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form
            className="grid gap-4"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              data.addExpense(values, data.user!.name);
              toast.success("Expense saved");
              router.push("/expenses");
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" error={form.formState.errors.date?.message}>
                <Controller
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <DateField
                      id="date"
                      label="Date"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!form.formState.errors.date}
                    />
                  )}
                />
              </Field>
              <Field label="Amount" htmlFor="amount" error={form.formState.errors.amount?.message}>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  {...form.register("amount", { valueAsNumber: true })}
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Invoice number" htmlFor="invoiceNumber" error={form.formState.errors.invoiceNumber?.message}>
                <Input id="invoiceNumber" {...form.register("invoiceNumber")} />
              </Field>
              <Field
                label="Debited by"
                info="The staff member who approved or paid this expense."
                error={form.formState.errors.debitedBy?.message}
              >
                <Controller
                  control={form.control}
                  name="debitedBy"
                  render={({ field }) => (
                    <OptionSelect value={field.value} onChange={field.onChange} options={staff} />
                  )}
                />
              </Field>
            </div>
            <Field label="Purpose" htmlFor="purpose" error={form.formState.errors.purpose?.message}>
              <Input id="purpose" {...form.register("purpose")} />
            </Field>
            <Field label="Notes" htmlFor="notes" error={form.formState.errors.notes?.message}>
              <Textarea id="notes" {...form.register("notes")} />
            </Field>
            <Field label="Bills" error={form.formState.errors.bills?.message}>
              <Controller
                control={form.control}
                name="bills"
                render={({ field }) => (
                  <BillDropzone
                    value={field.value}
                    onChange={(files) => {
                      form.clearErrors("bills");
                      field.onChange(files);
                    }}
                    onInvalid={(message) => form.setError("bills", { message })}
                  />
                )}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" className="w-fit">
                Save expense
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
