"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { OptionSelect } from "@/components/forms/option-select";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accessLevel } from "@/lib/permissions";
import { staffSchema, type StaffInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { ROLES } from "@/lib/types";

export function StaffFormScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "staff") : "none";
  const form = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Admissions",
      password: "",
      active: true,
    },
  });

  if (level !== "write" || !data.user) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <PageHeader
        eyebrow="Access"
        title="New staff login"
        description="They can sign in with this password until the tab is refreshed."
        actions={
          <Button asChild variant="outline">
            <Link href="/staff">Back to staff</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form
            className="grid gap-4"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              const result = data.addStaff(values, data.user!.name);
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              toast.success(`${values.name} can sign in now`);
              router.push("/staff");
            })}
          >
            <Field label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
              <Input id="name" {...form.register("name")} />
            </Field>
            <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
              <Input id="email" type="email" {...form.register("email")} />
            </Field>
            <Field label="Role" error={form.formState.errors.role?.message}>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <OptionSelect value={field.value} onChange={field.onChange} options={ROLES} />
                )}
              />
            </Field>
            <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
              <Input id="password" type="password" {...form.register("password")} />
            </Field>
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
                Create login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
