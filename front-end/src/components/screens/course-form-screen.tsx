"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { canManageCourses } from "@/lib/permissions";
import { courseSchema, type CourseInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";

const plainNumber =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function CourseFormScreen() {
  const data = useAcademy();
  const router = useRouter();
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      durationWeeks: 12,
      fee: undefined,
      summary: "",
      opensPlacement: false,
    },
  });
  const errors = form.formState.errors;

  if (!data.user || !canManageCourses(data.user.role, data.permissions)) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="New course"
        actions={
          <Button asChild variant="outline">
            <Link href="/courses">Back to courses</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form
            className="grid gap-4"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              const result = data.addCourse(values, data.user!.name);
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              toast.success("Course added");
              router.push(`/courses/${result.id}`);
            })}
          >
            <Field label="Name" htmlFor="courseName" error={errors.name?.message}>
              <Input id="courseName" {...form.register("name")} />
            </Field>
            <Field label="Duration in weeks" htmlFor="durationWeeks" error={errors.durationWeeks?.message}>
              <Input
                id="durationWeeks"
                type="number"
                min={1}
                className={plainNumber}
                {...form.register("durationWeeks", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Course fee" htmlFor="courseFee" error={errors.fee?.message}>
              <Input
                id="courseFee"
                type="number"
                min={1}
                className={plainNumber}
                {...form.register("fee", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Summary" htmlFor="summary" error={errors.summary?.message}>
              <Textarea id="summary" rows={3} {...form.register("summary")} />
            </Field>
            <Controller
              control={form.control}
              name="opensPlacement"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="opensPlacement"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <Label htmlFor="opensPlacement">Open an internal placement when a student joins</Label>
                </div>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" className="w-fit">
                Save course
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
