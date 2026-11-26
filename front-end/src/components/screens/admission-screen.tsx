"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Facts } from "@/components/facts";
import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { PhotoField } from "@/components/forms/photo-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { yearsOfAge } from "@/lib/dates";
import { formatDate, formatInr, formatPhone } from "@/lib/format";
import { canManageAdmissions } from "@/lib/permissions";
import { studentForAdmission } from "@/lib/records";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { BLOOD_GROUPS, GENDERS, type StudentProfile } from "@/lib/types";

export function AdmissionStudent({ id }: { id: string }) {
  const data = useAcademy();
  const admission = data.admissions.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  if (!admission || !data.user) return null;

  const student = studentForAdmission(data, admission);
  const manage = canManageAdmissions(data.user.role, data.permissions);
  const placement = data.placements.find((item) => item.admissionId === admission.id);
  const batches = admission.batchIds
    .map((batchId) => data.batches.find((batch) => batch.id === batchId))
    .filter((batch) => batch !== undefined);
  const available = data.batches.filter((batch) => !admission.batchIds.includes(batch.id));

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
          <CardDescription>
            {manage ? "Photo and basic details are kept with the student." : "Photo and basic details for this student."}
          </CardDescription>
          {manage ? (
            <div className="flex justify-end">
              <Button type="button" variant="outline" className="w-fit" onClick={() => setEditing((open) => !open)}>
                {editing ? "Close" : "Edit details"}
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          {editing ? (
            <ProfileForm
              enquiryId={admission.enquiryId}
              values={student}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="flex items-start gap-4">
                {student.photo ? (
                  <img src={student.photo} alt="" className="size-20 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-20 shrink-0 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">
                    No photo
                  </span>
                )}
                <p className="text-sm">{student.address || "No address yet."}</p>
              </div>
              <Facts
                items={[
                  {
                    label: "Date of birth",
                    value: student.dateOfBirth
                      ? `${formatDate(student.dateOfBirth)}${
                          yearsOfAge(student.dateOfBirth) !== null ? ` · ${yearsOfAge(student.dateOfBirth)} years` : ""
                        }`
                      : "",
                  },
                  { label: "Gender", value: student.gender },
                  { label: "Blood group", value: student.bloodGroup },
                  { label: "Qualification", value: student.qualification },
                  { label: "Contact", value: formatPhone(student.contact) },
                  { label: "Email", value: student.email },
                  { label: "Source", value: student.source },
                  { label: "Joined", value: formatDate(admission.joinedOn) },
                  ...(admission.status === "Discontinued"
                    ? [
                        { label: "Left on", value: formatDate(admission.discontinuedOn) },
                        { label: "Reason", value: admission.discontinueReason },
                      ]
                    : []),
                  {
                    label: "Referral bonus",
                    value: admission.referralBonus
                      ? `${formatInr(admission.referralBonus)} · ${admission.referrerName}`
                      : "None",
                  },
                  {
                    label: "Placement",
                    value: placement ? (
                      <Link href={`/placements/${placement.id}`} className="underline-offset-4 hover:underline">
                        {placement.id}
                      </Link>
                    ) : (
                      "Not on the testing placement list"
                    ),
                  },
                ]}
              />
            </>
          )}
        </CardContent>
      </Card>
      {editing ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Parent, emergency, and anyone else we should call.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <ContactGroup
              title="Parent or guardian"
              name={student.parentName}
              relation={student.parentRelation}
              contact={student.parentContact}
            />
            <ContactGroup
              title="Emergency contact"
              name={student.emergencyName}
              relation={student.emergencyRelation}
              contact={student.emergencyContact}
            />
            <ContactGroup
              title="Other contact"
              name={student.otherContactName}
              relation={student.otherContactNote}
              contact={student.otherContact}
            />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>A student can sit more than one batch. The first batch stays the home batch.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batch is attached yet.</p>
          ) : (
            <ul className="grid gap-2">
              {batches.map((batch) => {
                const course = data.courses.find((item) => item.id === batch.courseId);
                return (
                  <li key={batch.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <Link
                        href={`/courses/${batch.courseId}/batches/${batch.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {batch.name}
                      </Link>
                      <span className="ml-2 text-muted-foreground">{course?.name}</span>
                    </span>
                    {manage && admission.batchIds.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-fit"
                        onClick={() => {
                          const result = data.detachAdmissionBatch(admission.id, batch.id, data.user!.name);
                          if (!result.ok) toast.error(result.message);
                          else toast.success(`Removed from ${batch.name}`);
                        }}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {manage ? (
            <AttachBatch
              options={available.map((batch) => {
                const course = data.courses.find((item) => item.id === batch.courseId);
                return { value: batch.id, label: `${batch.name} · ${course?.name ?? "Course"}` };
              })}
              onAttach={(batchId) => {
                const result = data.assignAdmissionBatch(admission.id, batchId, data.user!.name);
                if (!result.ok) {
                  toast.error(result.message);
                  return false;
                }
                toast.success("Batch attached");
                return true;
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ContactGroup({
  title,
  name,
  relation,
  contact,
}: {
  title: string;
  name: string;
  relation: string;
  contact: string;
}) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {name || contact ? (
        <Facts
          items={[
            { label: "Name", value: name },
            { label: relation && title === "Other contact" ? "Note" : "Relation", value: relation },
            { label: "Contact", value: formatPhone(contact) },
          ]}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Not added yet.</p>
      )}
    </div>
  );
}

function ProfileForm({
  enquiryId,
  values,
  onDone,
}: {
  enquiryId: string;
  values: StudentProfile;
  onDone: () => void;
}) {
  const data = useAcademy();
  const form = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      ...values,
      gender: values.gender || undefined,
      bloodGroup: values.bloodGroup || undefined,
    },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={form.handleSubmit((input) => {
        const result = data.updateStudentProfile(enquiryId, input, data.user!.name);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Student details saved");
        onDone();
      })}
    >
      <Controller
        control={form.control}
        name="photo"
        render={({ field }) => (
          <PhotoField
            value={field.value}
            onChange={field.onChange}
            error={errors.photo?.message}
            onInvalid={(message) => form.setError("photo", { message })}
          />
        )}
      />
      <Field label="Date of birth" error={errors.dateOfBirth?.message}>
        <Controller
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <DateField label="Date of birth" value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>
      <Field label="Gender" error={errors.gender?.message}>
        <Controller
          control={form.control}
          name="gender"
          render={({ field }) => (
            <OptionSelect value={field.value ?? ""} onChange={field.onChange} options={[...GENDERS]} placeholder="Gender" />
          )}
        />
      </Field>
      <Field label="Blood group" error={errors.bloodGroup?.message}>
        <Controller
          control={form.control}
          name="bloodGroup"
          render={({ field }) => (
            <OptionSelect
              value={field.value ?? ""}
              onChange={field.onChange}
              options={[...BLOOD_GROUPS]}
              placeholder="Blood group"
            />
          )}
        />
      </Field>
      <Field label="Qualification" htmlFor="qualification" error={errors.qualification?.message}>
        <Input id="qualification" placeholder="Plus Two, BCA, B.Tech" {...form.register("qualification")} />
      </Field>
      <Field className="grid gap-1.5 sm:col-span-2" label="Address" htmlFor="address" error={errors.address?.message}>
        <Textarea id="address" rows={2} {...form.register("address")} />
      </Field>
      <Field label="Parent or guardian" htmlFor="parentName" error={errors.parentName?.message}>
        <Input id="parentName" {...form.register("parentName")} />
      </Field>
      <Field label="Relation" htmlFor="parentRelation" error={errors.parentRelation?.message}>
        <Input id="parentRelation" placeholder="Father, mother, or guardian" {...form.register("parentRelation")} />
      </Field>
      <Field label="Parent contact" htmlFor="parentContact" error={errors.parentContact?.message}>
        <Input id="parentContact" inputMode="numeric" {...form.register("parentContact")} />
      </Field>
      <Field label="Emergency contact" htmlFor="emergencyName" error={errors.emergencyName?.message}>
        <Input id="emergencyName" {...form.register("emergencyName")} />
      </Field>
      <Field label="Relation" htmlFor="emergencyRelation" error={errors.emergencyRelation?.message}>
        <Input id="emergencyRelation" {...form.register("emergencyRelation")} />
      </Field>
      <Field label="Emergency phone" htmlFor="emergencyContact" error={errors.emergencyContact?.message}>
        <Input id="emergencyContact" inputMode="numeric" {...form.register("emergencyContact")} />
      </Field>
      <Field
        className="grid gap-1.5 sm:col-span-2"
        label="Other contact"
        htmlFor="otherContactName"
        hint="Optional. Someone else we can reach."
        error={errors.otherContactName?.message}
      >
        <Input id="otherContactName" {...form.register("otherContactName")} />
      </Field>
      <Field label="Other phone" htmlFor="otherContact" error={errors.otherContact?.message}>
        <Input id="otherContact" inputMode="numeric" {...form.register("otherContact")} />
      </Field>
      <Field label="Note" htmlFor="otherContactNote" error={errors.otherContactNote?.message}>
        <Input id="otherContactNote" {...form.register("otherContactNote")} />
      </Field>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" className="w-fit">
          Save details
        </Button>
      </div>
    </form>
  );
}

function AttachBatch({
  options,
  onAttach,
}: {
  options: { value: string; label: string }[];
  onAttach: (batchId: string) => boolean;
}) {
  const [batchId, setBatchId] = useState("");

  return (
    <form
      className="flex flex-wrap items-end justify-end gap-2 border-t pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!batchId) return;
        if (onAttach(batchId)) setBatchId("");
      }}
    >
      <div className="min-w-56 flex-1">
        <OptionSelect
          value={batchId}
          onChange={setBatchId}
          options={options}
          placeholder={options.length ? "Attach another batch" : "Every batch is already attached"}
          disabled={options.length === 0}
        />
      </div>
      <Button type="submit" className="w-fit" disabled={!batchId}>
        Attach
      </Button>
    </form>
  );
}
