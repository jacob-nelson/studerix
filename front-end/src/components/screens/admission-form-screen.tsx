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
import { scheduleAmounts } from "@/lib/records";
import { formatInr } from "@/lib/format";
import { canManageAdmissions } from "@/lib/permissions";
import { directAdmissionSchema, type DirectAdmissionInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { SOURCES } from "@/lib/types";

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
      batchId: firstBatch?.id ?? "",
      feePlanId: firstCourse?.feePlans[0]?.id ?? "",
      joinedOn: isoDate(new Date()),
      agreedFee: firstCourse?.fee,
      referralBonus: 0,
      referrerName: "",
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

  if (!data.user || !canManageAdmissions(data.user.role, data.permissions)) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow="Admissions"
        title="New admission"
        description="Creates the student record and the fee account, and places the student on a batch."
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
                  ? "Admitted. The fee record and a placement are ready."
                  : "Admitted. The fee record is ready.",
              );
              router.push(`/admissions/${result.admissionId}`);
            })}
          >
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
                      form.setValue("batchId", batch?.id ?? "");
                      form.setValue("feePlanId", next?.feePlans[0]?.id ?? "");
                      if (next) form.setValue("agreedFee", next.fee);
                    }}
                    options={data.courses.map((item) => ({ value: item.id, label: item.name }))}
                    placeholder="Course"
                  />
                )}
              />
            </Field>
            <Field label="Batch" error={errors.batchId?.message}>
              <Controller
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <OptionSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={batches.map((batch) => ({ value: batch.id, label: batch.name }))}
                    placeholder={batches.length ? "Batch" : "Add a batch on the course first"}
                    disabled={batches.length === 0}
                  />
                )}
              />
            </Field>
            <Field
              className="grid gap-1.5 sm:col-span-2"
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
            <Field label="Joining date" error={errors.joinedOn?.message}>
              <Controller
                control={form.control}
                name="joinedOn"
                render={({ field }) => (
                  <DateField label="Joining date" value={field.value} onChange={field.onChange} />
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
