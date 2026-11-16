"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/seed";
import { signInSchema, type SignInInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";

export function SignInScreen() {
  const { signIn, staff } = useAcademy();
  const [formError, setFormError] = useState("");
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  function submit(values: SignInInput) {
    const result = signIn(values.email, values.password);
    if (!result.ok) setFormError(result.message);
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-heading text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each staff member has their own login. Pick a demo role or use the form.
        </p>
      </div>
      <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(submit)}>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            {...form.register("email")}
            aria-invalid={!!form.formState.errors.email}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
            aria-invalid={!!form.formState.errors.password}
          />
        </Field>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" size="lg">
          Sign in
        </Button>
        <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
          Forgot password
        </Link>
      </form>
      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">
          Demo password for every login: {DEMO_PASSWORD}. former@gotechmasters.com is deactivated.
        </p>
        <ul className="grid gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg bg-card px-3 py-2 text-left ring-1 ring-foreground/10 hover:bg-muted"
                onClick={() => {
                  setFormError("");
                  const live = staff.find(
                    (person) => person.email.toLowerCase() === account.email.toLowerCase(),
                  );
                  const result = signIn(account.email, live?.password ?? DEMO_PASSWORD);
                  if (!result.ok) setFormError(result.message);
                }}
              >
                <span>
                  <span className="block text-sm font-medium">{account.name}</span>
                  <span className="text-xs text-muted-foreground">{account.role}</span>
                </span>
                <span className="text-xs text-muted-foreground">Enter</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
