"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Facts } from "@/components/facts";
import { DateField } from "@/components/forms/date-field";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { OptionSelect } from "@/components/forms/option-select";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isoDate, suggestedBatch, suggestedFee } from "@/lib/dates";
import { formatDate, formatInr, formatPhone } from "@/lib/format";
import { scheduleAmounts } from "@/lib/records";
import { accessLevel } from "@/lib/permissions";
import { followUpSchema, joinSchema, type FollowUpInput, type JoinInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { BATCHES } from "@/lib/types";

export function EnquiryScreen({ id }: { id: string }) {
  const data = useAcademy();
  const router = useRouter();
  const enquiry = data.enquiries.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "enquiries", data.permissions) : "none";
  const [open, setOpen] = useState(false);

  if (level === "none") return <AccessDenied />;
  if (!enquiry || !data.user) return <MissingRecord href="/enquiries" label="Back to enquiries" />;

  const admission = data.admissions.find((item) => item.enquiryId === enquiry.id);
  const placement = admission
    ? data.placements.find((item) => item.admissionId === admission.id)
    : undefined;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow={enquiry.id}
        title={enquiry.studentName}
        description={`${enquiry.course} · ${enquiry.source}`}
        actions={
          <>
            <StatusBadge value={enquiry.status} />
            <Button asChild variant="outline">
              <Link href="/enquiries">All enquiries</Link>
            </Button>
          </>
        }
      />
      {enquiry.status === "Joined" && admission ? (
        <Card>
          <CardHeader>
            <CardTitle>Joined record</CardTitle>
            <CardDescription>
              This enquiry is the same student as {admission.id}. Details are not typed again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-end gap-2">
            <Button asChild>
              <Link href={`/admissions/${admission.id}`}>Open fee record</Link>
            </Button>
            {placement ? (
              <Button asChild variant="outline">
                <Link href={`/placements/${placement.id}`}>Open placement</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Enquiry date", value: formatDate(enquiry.enquiryDate) },
              { label: "Contact", value: formatPhone(enquiry.contact) },
              { label: "Email", value: enquiry.email },
              { label: "Group", value: enquiry.groupAdded ? "Added" : "Not added" },
              { label: "Follow-up", value: formatDate(enquiry.followUpDate) },
              { label: "Next action date", value: formatDate(enquiry.nextActionDate) },
              { label: "Next action", value: enquiry.nextAction },
              { label: "Remarks", value: enquiry.remarks },
            ]}
          />
        </CardContent>
      </Card>

      {level === "write" && enquiry.status !== "Joined" ? (
        <Card>
          <CardHeader>
            <CardTitle>Mark as Joined</CardTitle>
            <CardDescription>
              Creates the admission from this enquiry.
              {enquiry.course === "Software Testing"
                ? " Software Testing also opens an internal placement."
                : " This course does not open an internal placement."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button className="w-fit" onClick={() => setOpen(true)}>
              Continue to admission
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {level === "write" && enquiry.status !== "Joined" ? (
        <Card>
          <CardHeader>
            <CardTitle>Update enquiry</CardTitle>
          </CardHeader>
          <CardContent>
            <EnquiryForm
              defaultValues={enquiry}
              submitLabel="Save changes"
              onSubmit={(values) => {
                data.updateEnquiry({ ...enquiry, ...values }, data.user!.name);
                toast.success("Enquiry updated");
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {level === "write" && enquiry.status === "Joined" ? (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up notes</CardTitle>
            <CardDescription>
              The student, course and status stay linked to the admission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FollowUpForm
              defaultValues={enquiry}
              onSubmit={(values) => {
                data.saveFollowUp(enquiry, values, data.user!.name);
                toast.success("Follow-up saved");
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <JoinDialog
        open={open}
        onOpenChange={setOpen}
        course={enquiry.course}
        onConfirm={(values) => {
          const result = data.markJoined(enquiry.id, values, data.user!.name);
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          toast.success(
            enquiry.course === "Software Testing"
              ? "Joined. The fee record and a placement are ready."
              : "Joined. The fee record is ready.",
          );
          setOpen(false);
          router.push(`/admissions/${result.admissionId}`);
        }}
      />
    </div>
  );
}

function FollowUpForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues: FollowUpInput;
  onSubmit: (values: FollowUpInput) => void;
}) {
  const form = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues,
  });

  return (
    <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        control={form.control}
        name="groupAdded"
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id="joined-group"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <Label htmlFor="joined-group">Added to the batch group</Label>
          </div>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Follow-up date" hint="When someone will contact the student again.">
          <Controller
            control={form.control}
            name="followUpDate"
            render={({ field }) => (
              <DateField
                id="followUpDate"
                label="Follow-up date"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Next-action date" hint="When the planned step should happen.">
          <Controller
            control={form.control}
            name="nextActionDate"
            render={({ field }) => (
              <DateField
                id="nextActionDate"
                label="Next-action date"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
      </div>
      <Field label="Next action" htmlFor="nextAction">
        <Input id="nextAction" {...form.register("nextAction")} />
      </Field>
      <Field label="Remarks" htmlFor="remarks">
        <Textarea id="remarks" rows={4} {...form.register("remarks")} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" className="w-fit">
          Save follow-up
        </Button>
      </div>
    </form>
  );
}

function JoinDialog({
  open,
  onOpenChange,
  course,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: string;
  onConfirm: (values: JoinInput) => void;
}) {
  const data = useAcademy();
  const offering = data.courses.find((item) => item.name === course);
  const matching = offering
    ? data.batches.filter((batch) => batch.courseId === offering.id)
    : data.batches;
  const batchOptions = matching.length ? matching.map((batch) => batch.name) : offering ? [] : [...BATCHES];
  const form = useForm<JoinInput>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      joinedOn: isoDate(new Date()),
      batch: batchOptions.find((name) => name === suggestedBatch(course)) ?? batchOptions[0] ?? "",
      feePlanId: offering?.feePlans[0]?.id ?? "",
      agreedFee: offering?.fee ?? suggestedFee(course),
      referralBonus: 0,
      referrerName: "",
    },
  });
  const errors = form.formState.errors;
  const plans = offering?.feePlans ?? [];
  const plan = plans.find((item) => item.id === form.watch("feePlanId"));
  const agreedFee = form.watch("agreedFee");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Admission details</DialogTitle>
          <DialogDescription>
            The referral bonus is recorded against the admission and is not taken off the course fee.
          </DialogDescription>
        </DialogHeader>
        <form
          id="join-form"
          className="grid gap-4"
          noValidate
          onSubmit={form.handleSubmit(onConfirm)}
        >
          <Field label="Joining date" error={errors.joinedOn?.message}>
            <Controller
              control={form.control}
              name="joinedOn"
              render={({ field }) => (
                <DateField
                  id="joinedOn"
                  label="Joining date"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.joinedOn}
                />
              )}
            />
          </Field>
          <Field label="Batch" error={errors.batch?.message}>
            <Controller
              control={form.control}
              name="batch"
              render={({ field }) => (
                <OptionSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={batchOptions}
                  placeholder={batchOptions.length ? "Batch" : "Add a batch on the course first"}
                  disabled={batchOptions.length === 0}
                />
              )}
            />
          </Field>
          <Field
            label="Fee plan"
            error={errors.feePlanId?.message}
            hint={
              plan && Number.isFinite(agreedFee)
                ? scheduleAmounts(agreedFee, plan.parts)
                    .map((part) => `${part.label} ${part.percent}% (${formatInr(part.amount)})`)
                    .join(" · ")
                : undefined
            }
          >
            <Controller
              control={form.control}
              name="feePlanId"
              render={({ field }) => (
                <OptionSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={plans.map((item) => ({ value: item.id, label: item.name }))}
                  placeholder={plans.length ? "Fee plan" : "Add a fee plan on the course first"}
                  disabled={plans.length === 0}
                />
              )}
            />
          </Field>
          <Field label="Agreed course fee" htmlFor="agreedFee" error={errors.agreedFee?.message}>
            <Input
              id="agreedFee"
              type="number"
              min={1}
              {...form.register("agreedFee", { valueAsNumber: true })}
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </Field>
          <Field label="Referral bonus" htmlFor="referralBonus" error={errors.referralBonus?.message}>
            <Input
              id="referralBonus"
              type="number"
              min={0}
              {...form.register("referralBonus", { valueAsNumber: true })}
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </Field>
          <Field label="Referrer" htmlFor="referrerName" error={errors.referrerName?.message}>
            <Input id="referrerName" {...form.register("referrerName")} />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="join-form" className="w-fit">
            Mark Joined
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
