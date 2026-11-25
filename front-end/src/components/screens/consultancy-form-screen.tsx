"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isoDate } from "@/lib/dates";
import { accessLevel } from "@/lib/permissions";
import type { ConsultancyInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";
import { CandidateForm } from "@/components/screens/candidate-form";

export function ConsultancyFormScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "consultancy", data.permissions) : "none";
  if (level !== "write" || !data.user) return <AccessDenied />;

  const defaults: ConsultancyInput = {
    name: "",
    contact: "",
    email: "",
    progress: "Sourced",
    company: "",
    salary: "",
    agreedFee: 15000,
    addedOn: isoDate(new Date()),
    notes: "",
  };

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow="Consultancy"
        title="New candidate"
        description="This person is not an academy admission."
        actions={
          <Button asChild variant="outline">
            <Link href="/consultancy">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <CandidateForm
            defaultValues={defaults}
            submitLabel="Save candidate"
            onSubmit={(values) => {
              const id = data.addCandidate(values, data.user!.name);
              toast.success("Candidate added");
              router.push(`/consultancy/${id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
