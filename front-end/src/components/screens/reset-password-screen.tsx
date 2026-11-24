"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";

export function ResetPasswordScreen({ email }: { email: string }) {
  const { resetPassword } = useAcademy();
  const router = useRouter();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  if (!email) {
    return (
      <div className="grid gap-4">
        <h1 className="font-heading text-3xl">Reset password</h1>
        <p className="text-sm text-muted-foreground">Start from the forgot-password screen so we know which login to update.</p>
        <div className="flex justify-end">
          <Button asChild className="w-fit">
            <Link href="/forgot-password">Forgot password</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This updates {email} for the current browser tab.
        </p>
      </div>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          const result = resetPassword(email, values.password);
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          toast.success(
            result.active
              ? "Password updated. Sign in with the new one."
              : "Password updated. This login is still deactivated.",
          );
          router.push("/sign-in");
        })}
      >
        <Field label="New password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={form.formState.errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" className="w-fit">
            Update password
          </Button>
        </div>
        <Link href="/sign-in" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
