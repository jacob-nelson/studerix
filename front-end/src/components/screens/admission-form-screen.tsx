"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { PhotoField } from "@/components/forms/photo-field";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/lib/dates";
import { scheduleAmounts } from "@/lib/records";
import { formatDate, formatInr } from "@/lib/format";
import { canManageAdmissions } from "@/lib/permissions";
import { directAdmissionSchema, type DirectAdmissionInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { BLOOD_GROUPS, GENDERS, SOURCES } from "@/lib/types";

const plainNumber =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function AdmissionFormScreen() {
  const data = useAcademy();
  const router = useRouter();
  const firstCourse = data.courses[0];
  const firstBatch = data.batches.find((batch) => batch.courseId === firstCourse?.id);
  const form = useForm<DirectAdmissionInput>({
    resolver: zodResolver(directAdmissionSchema),
    defaultValues: {
      studentName: "",
      contact: "",
      email: "",
      source: "Walk-in",
      courseId: firstCourse?.id ?? "",
      batchIds: firstBatch ? [firstBatch.id] : [],
      feePlanId: firstCourse?.feePlans[0]?.id ?? "",
      joinedOn: isoDate(new Date()),
      agreedFee: firstCourse?.fee,
      referralBonus: 0,
      referrerName: "",
      address: "",
      photo: "",
      dateOfBirth: "",
      gender: undefined,
      bloodGroup: undefined,
      qualification: "",
      parentName: "",
      parentRelation: "",
      parentContact: "",
      emergencyName: "",
      emergencyRelation: "",
      emergencyContact: "",
      otherContactName: "",
      otherContact: "",
      otherContactNote: "",
    },
  });
  const errors = form.formState.errors;
  const courseId = form.watch("courseId");
  const course = data.courses.find((item) => item.id === courseId);
  const batches = data.batches.filter((batch) => batch.courseId === courseId);
  const plans = course?.feePlans ?? [];
  const planId = form.watch("feePlanId");
  const plan = plans.find((item) => item.id === planId);
  const agreedFee = form.watch("agreedFee");
  const batchIds = form.watch("batchIds");

  if (!data.user || !canManageAdmissions(data.user.role, data.permissions)) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow="Admissions"
        title="New admission"
        description="Creates the student, with photo and basic details, the fee account, and the batches they will attend."
        actions={
          <Button asChild variant="outline">
            <Link href="/admissions">Back to admissions</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              const result = data.addAdmission(values, data.user!.name);
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              toast.success(
                course?.opensPlacement
                  ? "Admitted. The student, fee record and a placement are ready."
                  : "Admitted. The student and fee record are ready.",
              );
              router.push(`/admissions/${result.admissionId}`);
            })}
          >
            <Section title="Student" />
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
            <Field label="Student name" htmlFor="studentName" error={errors.studentName?.message}>
              <Input id="studentName" {...form.register("studentName")} />
            </Field>
            <Field label="Contact" htmlFor="contact" error={errors.contact?.message}>
              <Input id="contact" inputMode="numeric" {...form.register("contact")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...form.register("email")} />
            </Field>
            <Field label="Source" error={errors.source?.message}>
              <Controller
                control={form.control}
                name="source"
                render={({ field }) => (
                  <OptionSelect value={field.value} onChange={field.onChange} options={SOURCES} />
                )}
              />
            </Field>
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
                  <OptionSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={[...GENDERS]}
                    placeholder="Gender"
                  />
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

            <Section title="Parent or guardian" />
            <Field label="Name" htmlFor="parentName" error={errors.parentName?.message}>
              <Input id="parentName" {...form.register("parentName")} />
            </Field>
            <Field label="Relation" htmlFor="parentRelation" error={errors.parentRelation?.message}>
              <Input id="parentRelation" placeholder="Father, mother, or guardian" {...form.register("parentRelation")} />
            </Field>
            <Field label="Contact" htmlFor="parentContact" error={errors.parentContact?.message}>
              <Input id="parentContact" inputMode="numeric" {...form.register("parentContact")} />
            </Field>

            <Section title="Emergency contact" />
            <Field label="Name" htmlFor="emergencyName" error={errors.emergencyName?.message}>
              <Input id="emergencyName" {...form.register("emergencyName")} />
            </Field>
            <Field label="Relation" htmlFor="emergencyRelation" error={errors.emergencyRelation?.message}>
              <Input id="emergencyRelation" {...form.register("emergencyRelation")} />
            </Field>
            <Field label="Contact" htmlFor="emergencyContact" error={errors.emergencyContact?.message}>
              <Input id="emergencyContact" inputMode="numeric" {...form.register("emergencyContact")} />
            </Field>

            <Section title="Other contact" hint="Optional. Someone else we can reach." />
            <Field label="Name" htmlFor="otherContactName" error={errors.otherContactName?.message}>
              <Input id="otherContactName" {...form.register("otherContactName")} />
            </Field>
            <Field label="Contact" htmlFor="otherContact" error={errors.otherContact?.message}>
              <Input id="otherContact" inputMode="numeric" {...form.register("otherContact")} />
            </Field>
            <Field
              className="grid gap-1.5 sm:col-span-2"
              label="Note"
              htmlFor="otherContactNote"
              error={errors.otherContactNote?.message}
            >
              <Input id="otherContactNote" {...form.register("otherContactNote")} />
            </Field>

            <Section title="Course and batches" hint="Tick every batch this student will attend." />
            <Field label="Course" error={errors.courseId?.message}>
              <Controller
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <OptionSelect
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      const next = data.courses.find((item) => item.id === value);
                      const batch = data.batches.find((item) => item.courseId === value);
                      form.setValue("batchIds", batch ? [batch.id] : [], { shouldValidate: true });
                      form.setValue("feePlanId", next?.feePlans[0]?.id ?? "");
                      if (next) form.setValue("agreedFee", next.fee);
                    }}
                    options={data.courses.map((item) => ({ value: item.id, label: item.name }))}
                    placeholder="Course"
                  />
                )}
              />
            </Field>
            <Field label="Joining date" error={errors.joinedOn?.message}>
              <Controller
                control={form.control}
                name="joinedOn"
                render={({ field }) => (
                  <DateField label="Joining date" value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <div className="grid gap-2 sm:col-span-2">
              <p className="text-sm font-medium">Batches</p>
              {batches.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add a batch on the course first.</p>
              ) : (
                <div className="grid gap-2">
                  {batches.map((batch) => {
                    const checked = batchIds.includes(batch.id);
                    return (
                      <label key={batch.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const next = value === true
                              ? [...batchIds, batch.id]
                              : batchIds.filter((item) => item !== batch.id);
                            form.setValue("batchIds", next, { shouldValidate: true });
                          }}
                        />
                        {batch.name}
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.batchIds?.message ? <p className="text-xs text-destructive">{errors.batchIds.message}</p> : null}
            </div>
            <Field
              className="grid gap-1.5 sm:col-span-2"
              label="Fee plan"
              error={errors.feePlanId?.message}
              hint={
                plan && Number.isFinite(agreedFee)
                  ? scheduleAmounts(agreedFee, plan.parts)
                      .map((part) => `${part.label} ${part.percent}% due ${formatDate(part.dueOn)} (${formatInr(part.amount)})`)
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
            <Field label="Agreed fee" htmlFor="agreedFee" error={errors.agreedFee?.message}>
              <Input
                id="agreedFee"
                type="number"
                min={1}
                className={plainNumber}
                {...form.register("agreedFee", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Referral bonus" htmlFor="referralBonus" error={errors.referralBonus?.message}>
              <Input
                id="referralBonus"
                type="number"
                min={0}
                className={plainNumber}
                {...form.register("referralBonus", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Referrer" htmlFor="referrerName" error={errors.referrerName?.message}>
              <Input id="referrerName" {...form.register("referrerName")} />
            </Field>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" className="w-fit">
                Save admission
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid gap-1 border-t pt-2 sm:col-span-2 first:border-0 first:pt-0">
      <h2 className="font-heading text-lg">{title}</h2>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
