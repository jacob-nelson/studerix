"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/lib/dates";
import { accessLevel } from "@/lib/permissions";
import { staffSchema, type StaffInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { ATTENDANCE_MARKS, BLOOD_GROUPS, GENDERS, ROLES, STAFF_KINDS } from "@/lib/types";

const plainNumber =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function StaffFormScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";
  const form = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      contact: "",
      photo: "",
      gender: "" as StaffInput["gender"],
      bloodGroup: "" as StaffInput["bloodGroup"],
      address: "",
      qualifications: [{ title: "" }],
      joinedOn: isoDate(new Date()),
      relievedOn: "",
      offeredSalary: undefined as unknown as number,
      bank: { accountName: "", bankName: "", accountNumber: "", ifsc: "" },
      kind: "Teaching",
      role: "Faculty",
      password: "",
      active: true,
      attendance: [],
    },
  });
  const qualifications = useFieldArray({ control: form.control, name: "qualifications" });
  const attendance = useFieldArray({ control: form.control, name: "attendance" });

  if (level !== "write" || !data.user) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow="People"
        title="Onboard staff"
        description="Teaching staff take classes. Non-teaching staff support the batch or the desk. They can sign in with this password until the tab is refreshed."
        actions={
          <Button asChild variant="outline">
            <Link href="/staff">Back to staff</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              const result = data.addStaff(values, data.user!.name);
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              toast.success(`${values.name} onboarded as ${values.kind.toLowerCase()} staff`);
              router.push(`/staff/${result.id}`);
            })}
          >
            <Controller
              control={form.control}
              name="photo"
              render={({ field }) => (
                <PhotoField
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.photo?.message}
                  onInvalid={(message) => form.setError("photo", { message })}
                />
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
                <Input id="name" {...form.register("name")} />
              </Field>
              <Field label="Contact number" htmlFor="contact" error={form.formState.errors.contact?.message}>
                <Input id="contact" inputMode="numeric" {...form.register("contact")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gender" error={form.formState.errors.gender?.message}>
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
              <Field label="Blood group" error={form.formState.errors.bloodGroup?.message}>
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
            </div>
            <Field label="Address" htmlFor="address" error={form.formState.errors.address?.message}>
              <Textarea id="address" {...form.register("address")} />
            </Field>
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Qualifications</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => qualifications.append({ title: "" })}
                  disabled={qualifications.fields.length >= 8}
                >
                  <Plus />
                  Add qualification
                </Button>
              </div>
              {qualifications.fields.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2">
                  <Field
                    className="grid flex-1 gap-1.5"
                    label={index === 0 ? "Highest qualification" : `Qualification ${index + 1}`}
                    htmlFor={`qualification-${index}`}
                    error={form.formState.errors.qualifications?.[index]?.title?.message}
                  >
                    <Input id={`qualification-${index}`} {...form.register(`qualifications.${index}.title`)} />
                  </Field>
                  {qualifications.fields.length > 1 ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="mt-6"
                      aria-label={`Remove qualification ${index + 1}`}
                      onClick={() => qualifications.remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              ))}
              {form.formState.errors.qualifications?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.qualifications.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Joining date" error={form.formState.errors.joinedOn?.message}>
                <Controller
                  control={form.control}
                  name="joinedOn"
                  render={({ field }) => (
                    <DateField label="Joining date" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field label="Relieving date" error={form.formState.errors.relievedOn?.message}>
                <Controller
                  control={form.control}
                  name="relievedOn"
                  render={({ field }) => (
                    <DateField label="Relieving date" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
            </div>
            <div className="grid gap-3">
              <p className="text-sm font-medium">Salary and bank</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Offered salary"
                  htmlFor="offered-salary"
                  hint="Monthly amount when they join."
                  error={form.formState.errors.offeredSalary?.message}
                >
                  <Input
                    id="offered-salary"
                    type="number"
                    min={1}
                    className={plainNumber}
                    {...form.register("offeredSalary", { valueAsNumber: true })}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Account name" htmlFor="account-name" error={form.formState.errors.bank?.accountName?.message}>
                  <Input id="account-name" {...form.register("bank.accountName")} />
                </Field>
                <Field label="Bank" htmlFor="bank-name" error={form.formState.errors.bank?.bankName?.message}>
                  <Input id="bank-name" {...form.register("bank.bankName")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Account number" htmlFor="account-number" error={form.formState.errors.bank?.accountNumber?.message}>
                  <Input id="account-number" inputMode="numeric" {...form.register("bank.accountNumber")} />
                </Field>
                <Field label="IFSC" htmlFor="ifsc" error={form.formState.errors.bank?.ifsc?.message}>
                  <Input id="ifsc" {...form.register("bank.ifsc")} />
                </Field>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" error={form.formState.errors.kind?.message}>
                <Controller
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <OptionSelect value={field.value} onChange={field.onChange} options={STAFF_KINDS} />
                  )}
                />
              </Field>
              <Field label="Desk role" error={form.formState.errors.role?.message}>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <OptionSelect value={field.value} onChange={field.onChange} options={ROLES} />
                  )}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
                <Input id="email" type="email" {...form.register("email")} />
              </Field>
              <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
                <Input id="password" type="password" {...form.register("password")} />
              </Field>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="grid gap-1">
                  <p className="text-sm font-medium">Attendance</p>
                  <p className="text-xs text-muted-foreground">Optional. Mark days already worked.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => attendance.append({ date: isoDate(new Date()), status: "Present", note: "" })}
                >
                  <Plus />
                  Add attendance
                </Button>
              </div>
              {attendance.fields.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_10rem_1fr_auto]">
                  <Field label="Date" error={form.formState.errors.attendance?.[index]?.date?.message}>
                    <Controller
                      control={form.control}
                      name={`attendance.${index}.date`}
                      render={({ field }) => (
                        <DateField label="Date" value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </Field>
                  <Field label="Status" error={form.formState.errors.attendance?.[index]?.status?.message}>
                    <Controller
                      control={form.control}
                      name={`attendance.${index}.status`}
                      render={({ field }) => (
                        <OptionSelect value={field.value} onChange={field.onChange} options={ATTENDANCE_MARKS} />
                      )}
                    />
                  </Field>
                  <Field label="Note" htmlFor={`attendance-note-${index}`} error={form.formState.errors.attendance?.[index]?.note?.message}>
                    <Input id={`attendance-note-${index}`} {...form.register(`attendance.${index}.note`)} />
                  </Field>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="mt-6"
                    aria-label={`Remove attendance ${index + 1}`}
                    onClick={() => attendance.remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {form.formState.errors.attendance?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.attendance.message}</p>
              ) : null}
            </div>
            <Controller
              control={form.control}
              name="active"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" className="w-fit">
                Onboard
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
