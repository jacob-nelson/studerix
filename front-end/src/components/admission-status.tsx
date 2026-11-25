"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DateField } from "@/components/forms/date-field";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/lib/dates";
import { canManageAdmissions } from "@/lib/permissions";
import { discontinueSchema, type DiscontinueInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import type { Admission } from "@/lib/types";

export function AdmissionStatusActions({
  admission,
  studentName,
}: {
  admission: Admission;
  studentName: string;
}) {
  const data = useAcademy();
  const [open, setOpen] = useState(false);
  if (!data.user || !canManageAdmissions(data.user.role, data.permissions)) return null;

  function apply(status: Admission["status"], input: DiscontinueInput | null) {
    const result = data.setAdmissionStatus(admission.id, status, input, data.user!.name);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(
      status === "Discontinued"
        ? `${studentName} discontinued`
        : status === "Completed"
          ? `${studentName} marked completed`
          : `${studentName} is active again`,
    );
    setOpen(false);
  }

  return (
    <div className="flex flex-wrap justify-end gap-2" onClick={(event) => event.stopPropagation()}>
      {admission.status === "Active" ? (
        <>
          <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => apply("Completed", null)}>
            Complete
          </Button>
          <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => setOpen(true)}>
            Discontinue
          </Button>
        </>
      ) : (
        <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => apply("Active", null)}>
          Restore
        </Button>
      )}
      <DiscontinueDialog
        open={open}
        studentName={studentName}
        onOpenChange={setOpen}
        onConfirm={(values) => apply("Discontinued", values)}
      />
    </div>
  );
}

function DiscontinueDialog({
  open,
  studentName,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  studentName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: DiscontinueInput) => void;
}) {
  const form = useForm<DiscontinueInput>({
    resolver: zodResolver(discontinueSchema),
    defaultValues: { discontinuedOn: isoDate(new Date()), discontinueReason: "" },
  });
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Discontinue {studentName}</DialogTitle>
          <DialogDescription>
            The fee record and audit trail stay. New classes are no longer expected.
          </DialogDescription>
        </DialogHeader>
        <form id="discontinue-form" className="grid gap-4" noValidate onSubmit={form.handleSubmit(onConfirm)}>
          <Field label="Date" error={errors.discontinuedOn?.message}>
            <Controller
              control={form.control}
              name="discontinuedOn"
              render={({ field }) => (
                <DateField
                  label="Date"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.discontinuedOn}
                />
              )}
            />
          </Field>
          <Field label="Reason" htmlFor="discontinueReason" error={errors.discontinueReason?.message}>
            <Textarea id="discontinueReason" rows={3} {...form.register("discontinueReason")} />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="discontinue-form" className="w-fit">
            Discontinue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
