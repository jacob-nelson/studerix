"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas";

export function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState("");
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (sentTo) {
    return (
      <div className="grid gap-4">
        <h1 className="font-heading text-3xl">Check the reset link</h1>
        <p className="text-sm text-muted-foreground">
          If {sentTo} is a staff login, a reset link would be sent. This prototype opens that
          screen directly.
        </p>
        <Button asChild size="lg">
          <Link href={`/reset-password?email=${encodeURIComponent(sentTo)}`}>
            Continue to reset password
          </Link>
        </Button>
        <button
          type="button"
          className="text-left text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setSentTo("")}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email on the staff login. You will set a new password on the next screen.
        </p>
      </div>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={form.handleSubmit((values) => setSentTo(values.email.trim()))}
      >
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
        </Field>
        <Button type="submit" size="lg">
          Send reset link
        </Button>
        <Link href="/sign-in" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
