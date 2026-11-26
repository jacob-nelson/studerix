"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatInr, formatMonth } from "@/lib/format";
import { isoDate } from "@/lib/dates";
import { currentRevision, nextRevision } from "@/lib/records";
import {
  salaryRevisionSchema,
  salaryTransferSchema,
  staffBankSchema,
  type SalaryRevisionInput,
  type SalaryTransferInput,
  type StaffBankInput,
} from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { PAYMENT_MODES, type SalaryRevision, type SalaryTransfer, type StaffUser } from "@/lib/types";

const plainNumber =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function StaffPay({ person, canWrite }: { person: StaffUser; canWrite: boolean }) {
  const data = useAcademy();
  const actor = data.user?.name ?? "";
  const [editingBank, setEditingBank] = useState(false);
  const today = isoDate(new Date());
  const month = today.slice(0, 7);
  const offered = currentRevision(person.revisions, today);
  const upcoming = nextRevision(person.revisions, today);
  const monthPaid = person.transfers
    .filter((item) => item.period === month)
    .reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = person.transfers.reduce((sum, item) => sum + item.amount, 0);

  const bankForm = useForm<StaffBankInput>({
    resolver: zodResolver(staffBankSchema),
    defaultValues: person.bank,
  });
  const revisionForm = useForm<SalaryRevisionInput>({
    resolver: zodResolver(salaryRevisionSchema),
    defaultValues: { effectiveOn: today, amount: undefined as unknown as number, reason: "" },
  });
  const transferForm = useForm<SalaryTransferInput>({
    resolver: zodResolver(salaryTransferSchema),
    defaultValues: {
      paidOn: today,
      period: month,
      amount: offered?.amount ?? (undefined as unknown as number),
      mode: "Bank transfer",
      reference: "",
      note: "",
    },
  });

  const revisionColumns: AppColumn<SalaryRevision>[] = [
    {
      accessorKey: "effectiveOn",
      header: "From",
      sortFn: "alphanumeric",
      cell: (info) => formatDate(String(info.getValue())),
    },
    {
      accessorKey: "amount",
      header: "Salary",
      sortFn: "basic",
      cell: (info) => formatInr(Number(info.getValue())),
    },
    { accessorKey: "reason", header: "Reason", sortFn: "text" },
    {
      id: "action",
      header: "",
      enableSorting: false,
      cell: (info) =>
        canWrite ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              const result = data.removeSalaryRevision(person.id, info.row.original.id, actor);
              if (!result.ok) toast.error(result.message);
              else toast.success("Revision removed");
            }}
          >
            Remove
          </Button>
        ) : null,
    },
  ];

  const transferColumns: AppColumn<SalaryTransfer>[] = [
    {
      accessorKey: "paidOn",
      header: "Paid on",
      sortFn: "alphanumeric",
      cell: (info) => formatDate(String(info.getValue())),
    },
    {
      accessorKey: "period",
      header: "Salary for",
      sortFn: "alphanumeric",
      cell: (info) => formatMonth(String(info.getValue())),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      sortFn: "basic",
      cell: (info) => formatInr(Number(info.getValue())),
    },
    { accessorKey: "mode", header: "Paid by", sortFn: "text" },
    {
      accessorKey: "reference",
      header: "Reference",
      sortFn: "text",
      cell: (info) => String(info.getValue() || "—"),
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
        canWrite ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              const result = data.removeSalaryTransfer(person.id, info.row.original.id, actor);
              if (!result.ok) toast.error(result.message);
              else toast.success("Transfer removed");
            }}
          >
            Remove
          </Button>
        ) : null,
    },
  ];

  const monthLine = offered
    ? monthPaid === offered.amount
      ? `${formatInr(monthPaid)} transferred`
      : `${formatInr(monthPaid)} of ${formatInr(offered.amount)} transferred`
    : formatInr(monthPaid);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Salary</CardTitle>
          <CardDescription>Offered salary, later revisions, and each transfer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Offered</dt>
              <dd className="text-sm">{offered ? `${formatInr(offered.amount)} / month` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Since</dt>
              <dd className="text-sm">{offered ? formatDate(offered.effectiveOn) : "—"}</dd>
            </div>
            {upcoming ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Next revision</dt>
                <dd className="text-sm">
                  {formatInr(upcoming.amount)} / month from {formatDate(upcoming.effectiveOn)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-muted-foreground">{formatMonth(month)}</dt>
              <dd className="text-sm">{monthLine}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Total transferred</dt>
              <dd className="text-sm">{formatInr(totalPaid)}</dd>
            </div>
          </dl>

          <div className="grid gap-3">
            <p className="text-sm font-medium">Revisions</p>
            {canWrite ? (
              <form
                className="grid gap-3 border-b pb-4"
                noValidate
                onSubmit={revisionForm.handleSubmit((values) => {
                  const result = data.reviseStaffSalary(person.id, values, actor);
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  toast.success("Salary revised");
                  revisionForm.reset({ effectiveOn: today, amount: undefined as unknown as number, reason: "" });
                })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="New salary" htmlFor="revision-amount" error={revisionForm.formState.errors.amount?.message}>
                    <Input
                      id="revision-amount"
                      type="number"
                      min={1}
                      className={plainNumber}
                      {...revisionForm.register("amount", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label="Effective from" error={revisionForm.formState.errors.effectiveOn?.message}>
                    <Controller
                      control={revisionForm.control}
                      name="effectiveOn"
                      render={({ field }) => (
                        <DateField label="Effective from" value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </Field>
                </div>
                <Field label="Reason" htmlFor="revision-reason" error={revisionForm.formState.errors.reason?.message}>
                  <Input id="revision-reason" {...revisionForm.register("reason")} />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" className="w-fit">
                    Revise
                  </Button>
                </div>
              </form>
            ) : null}
            <DataTable
              data={[...person.revisions].sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn))}
              columns={revisionColumns}
              searchPlaceholder="Search revisions"
            />
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-medium">Transferred</p>
            {canWrite ? (
              <form
                className="grid gap-3 border-b pb-4"
                noValidate
                onSubmit={transferForm.handleSubmit((values) => {
                  const result = data.recordSalaryTransfer(person.id, values, actor);
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  toast.success("Salary transferred");
                  transferForm.reset({
                    paidOn: today,
                    period: month,
                    amount: offered?.amount ?? (undefined as unknown as number),
                    mode: "Bank transfer",
                    reference: "",
                    note: "",
                  });
                })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Paid on" error={transferForm.formState.errors.paidOn?.message}>
                    <Controller
                      control={transferForm.control}
                      name="paidOn"
                      render={({ field }) => <DateField label="Paid on" value={field.value} onChange={field.onChange} />}
                    />
                  </Field>
                  <Field label="Salary for" htmlFor="salary-period" error={transferForm.formState.errors.period?.message}>
                    <Input id="salary-period" type="month" {...transferForm.register("period")} />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Amount" htmlFor="transfer-amount" error={transferForm.formState.errors.amount?.message}>
                    <Input
                      id="transfer-amount"
                      type="number"
                      min={1}
                      className={plainNumber}
                      {...transferForm.register("amount", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label="Paid by" error={transferForm.formState.errors.mode?.message}>
                    <Controller
                      control={transferForm.control}
                      name="mode"
                      render={({ field }) => (
                        <OptionSelect value={field.value} onChange={field.onChange} options={PAYMENT_MODES} />
                      )}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Reference" htmlFor="transfer-reference" error={transferForm.formState.errors.reference?.message}>
                    <Input id="transfer-reference" {...transferForm.register("reference")} />
                  </Field>
                  <Field label="Note" htmlFor="transfer-note" error={transferForm.formState.errors.note?.message}>
                    <Input id="transfer-note" {...transferForm.register("note")} />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="w-fit">
                    Record transfer
                  </Button>
                </div>
              </form>
            ) : null}
            {person.transfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No salary transferred yet.</p>
            ) : (
              <DataTable
                data={[...person.transfers].sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.period.localeCompare(a.period))}
                columns={transferColumns}
                searchPlaceholder="Search transfers"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank</CardTitle>
          <CardDescription>Account the salary is transferred to.</CardDescription>
          {canWrite && !editingBank ? (
            <CardAction>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  bankForm.reset(person.bank);
                  setEditingBank(true);
                }}
              >
                Edit
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {editingBank ? (
            <form
              className="grid gap-3"
              noValidate
              onSubmit={bankForm.handleSubmit((values) => {
                const result = data.updateStaffBank(person.id, values, actor);
                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }
                toast.success("Bank details updated");
                setEditingBank(false);
              })}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Account name" htmlFor="edit-account-name" error={bankForm.formState.errors.accountName?.message}>
                  <Input id="edit-account-name" {...bankForm.register("accountName")} />
                </Field>
                <Field label="Bank" htmlFor="edit-bank-name" error={bankForm.formState.errors.bankName?.message}>
                  <Input id="edit-bank-name" {...bankForm.register("bankName")} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Account number" htmlFor="edit-account-number" error={bankForm.formState.errors.accountNumber?.message}>
                  <Input id="edit-account-number" inputMode="numeric" {...bankForm.register("accountNumber")} />
                </Field>
                <Field label="IFSC" htmlFor="edit-ifsc" error={bankForm.formState.errors.ifsc?.message}>
                  <Input id="edit-ifsc" {...bankForm.register("ifsc")} />
                </Field>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    bankForm.reset(person.bank);
                    setEditingBank(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-fit">
                  Save bank details
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Account name</dt>
                <dd className="text-sm">{person.bank.accountName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Bank</dt>
                <dd className="text-sm">{person.bank.bankName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Account number</dt>
                <dd className="text-sm">{person.bank.accountNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">IFSC</dt>
                <dd className="text-sm">{person.bank.ifsc}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </>
  );
}
