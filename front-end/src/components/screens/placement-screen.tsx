"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Facts } from "@/components/facts";
import { DateField } from "@/components/forms/date-field";
import { OptionSelect } from "@/components/forms/option-select";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPhone } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { studentForAdmission } from "@/lib/records";
import { placementSchema, type PlacementInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { MOCK_RANKS, PLACEMENT_STATUSES } from "@/lib/types";

export function PlacementScreen({ id }: { id: string }) {
  const data = useAcademy();
  const placement = data.placements.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "placements") : "none";
  const admission = data.admissions.find((item) => item.id === placement?.admissionId);
  const student = admission
    ? studentForAdmission(data, admission)
    : null;

  if (level === "none") return <AccessDenied />;
  if (!placement || !student || !data.user) {
    return <MissingRecord href="/placements" label="Back to placements" />;
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow={placement.id}
        title={student.name}
        description="Shared from the student record. Rank, company and salary are entered here."
        actions={
          <>
            <StatusBadge value={placement.status} />
            <Button asChild variant="outline">
              <Link href={`/admissions/${placement.admissionId}`}>Fee record</Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>From the student record</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Contact", value: formatPhone(student.contact) },
              { label: "Email", value: student.email },
              { label: "Course", value: student.course },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Placement</CardTitle>
        </CardHeader>
        <CardContent>
          {level === "write" ? (
            <PlacementEditor
              values={placement}
              onSubmit={(values) => {
                data.updatePlacement(placement, values, data.user!.name);
                toast.success("Placement updated");
              }}
            />
          ) : (
            <Facts
              items={[
                { label: "Mock rank", value: placement.mockRank },
                { label: "Company", value: placement.company },
                { label: "Salary", value: placement.salary },
                { label: "Notes", value: placement.notes },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlacementEditor({
  values,
  onSubmit,
}: {
  values: PlacementInput;
  onSubmit: (values: PlacementInput) => void;
}) {
  const form = useForm<PlacementInput>({
    resolver: zodResolver(placementSchema),
    defaultValues: values,
  });
  const errors = form.formState.errors;

  return (
    <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <Field label="Mock rank" error={errors.mockRank?.message}>
        <Controller
          control={form.control}
          name="mockRank"
          render={({ field }) => (
            <OptionSelect value={field.value} onChange={field.onChange} options={MOCK_RANKS} />
          )}
        />
      </Field>
      <Field label="Status" error={errors.status?.message}>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <OptionSelect value={field.value} onChange={field.onChange} options={PLACEMENT_STATUSES} />
          )}
        />
      </Field>
      <Field label="Company" htmlFor="company" error={errors.company?.message}>
        <Input id="company" {...form.register("company")} />
      </Field>
      <Field label="Salary" htmlFor="salary" error={errors.salary?.message}>
        <Input id="salary" placeholder="4.2 LPA" {...form.register("salary")} />
      </Field>
      <Field label="Updated on" error={errors.updatedOn?.message}>
        <Controller
          control={form.control}
          name="updatedOn"
          render={({ field }) => (
            <DateField
              id="updatedOn"
              label="Updated on"
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.updatedOn}
            />
          )}
        />
      </Field>
      <Field className="grid gap-1.5 sm:col-span-2" label="Notes" htmlFor="notes">
        <Textarea id="notes" rows={4} {...form.register("notes")} />
      </Field>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" className="w-fit">
          Save placement
        </Button>
      </div>
    </form>
  );
}
