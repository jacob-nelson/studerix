"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Facts } from "@/components/facts";
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
import { formatDate, formatPhone } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { followUpSchema, joinSchema, type FollowUpInput, type JoinInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { BATCHES } from "@/lib/types";

export function EnquiryScreen({ id }: { id: string }) {
  const data = useAcademy();
  const router = useRouter();
  const enquiry = data.enquiries.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "enquiries") : "none";
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
          <CardContent className="flex flex-wrap gap-2">
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
          <CardContent>
            <Button onClick={() => setOpen(true)}>Continue to admission</Button>
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
        <Field label="Follow-up date" htmlFor="followUpDate" hint="When someone will contact the student again.">
          <Input id="followUpDate" type="date" {...form.register("followUpDate")} />
        </Field>
        <Field label="Next-action date" htmlFor="nextActionDate" hint="When the planned step should happen.">
          <Input id="nextActionDate" type="date" {...form.register("nextActionDate")} />
        </Field>
      </div>
      <Field label="Next action" htmlFor="nextAction">
        <Input id="nextAction" {...form.register("nextAction")} />
      </Field>
      <Field label="Remarks" htmlFor="remarks">
        <Textarea id="remarks" rows={4} {...form.register("remarks")} />
      </Field>
      <Button type="submit">Save follow-up</Button>
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
  const form = useForm<JoinInput>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      joinedOn: isoDate(new Date()),
      batch: suggestedBatch(course),
      agreedFee: suggestedFee(course),
      referralBonus: 0,
      referrerName: "",
    },
  });
  const errors = form.formState.errors;

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
          <Field label="Joining date" htmlFor="joinedOn" error={errors.joinedOn?.message}>
            <Input id="joinedOn" type="date" {...form.register("joinedOn")} />
          </Field>
          <Field label="Batch" error={errors.batch?.message}>
            <Controller
              control={form.control}
              name="batch"
              render={({ field }) => (
                <OptionSelect value={field.value} onChange={field.onChange} options={BATCHES} />
              )}
            />
          </Field>
          <Field label="Agreed course fee" htmlFor="agreedFee" error={errors.agreedFee?.message}>
            <Input
              id="agreedFee"
              type="number"
              min={1}
              {...form.register("agreedFee", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Referral bonus" htmlFor="referralBonus" error={errors.referralBonus?.message}>
            <Input
              id="referralBonus"
              type="number"
              min={0}
              {...form.register("referralBonus", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Referrer" htmlFor="referrerName" error={errors.referrerName?.message}>
            <Input id="referrerName" {...form.register("referrerName")} />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="join-form">
            Mark Joined
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
