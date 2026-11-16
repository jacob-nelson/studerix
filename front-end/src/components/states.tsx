import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-heading text-2xl">This role does not open that module</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in with another demo role if you want to walk through it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

export function MissingRecord({ href, label }: { href: string; label: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-heading text-2xl">That record is not in this prototype</h1>
      <Button asChild variant="outline" className="mt-6">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
