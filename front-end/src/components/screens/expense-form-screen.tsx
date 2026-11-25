"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
            <Field label="Purpose" htmlFor="purpose" error={form.formState.errors.purpose?.message}>
              <Input id="purpose" {...form.register("purpose")} />
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
            <Field
              label="Debited by"
              hint="The staff member who approved or paid this expense."
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
