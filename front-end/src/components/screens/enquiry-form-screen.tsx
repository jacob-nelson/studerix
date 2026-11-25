"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isoDate } from "@/lib/dates";
import { accessLevel } from "@/lib/permissions";
import type { EnquiryInput } from "@/lib/schemas";
import { useAcademy } from "@/lib/store";

const defaults: EnquiryInput = {
  enquiryDate: "",
  studentName: "",
  contact: "",
  email: "",
  groupAdded: false,
  source: "Walk-in",
  course: "Software Testing",
  status: "New",
  remarks: "",
  followUpDate: "",
  nextActionDate: "",
  nextAction: "",
};

export function EnquiryFormScreen() {
  const { addEnquiry, user, permissions } = useAcademy();
  const router = useRouter();
  const level = user ? accessLevel(user.role, "enquiries", permissions) : "none";
  if (level !== "write" || !user) return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow="Enquiries"
        title="New enquiry"
        description="Follow-up is the next call. Next action is the step you expect, such as a campus visit."
        actions={
          <Button asChild variant="outline">
            <Link href="/enquiries">Back to enquiries</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <EnquiryForm
            defaultValues={{ ...defaults, enquiryDate: isoDate(new Date()) }}
            submitLabel="Save enquiry"
            onSubmit={(values) => {
              const id = addEnquiry(values, user.name);
              toast.success("Enquiry saved");
              router.push(`/enquiries/${id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
