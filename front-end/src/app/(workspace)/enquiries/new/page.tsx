import type { Metadata } from "next";
import { EnquiryFormScreen } from "@/components/screens/enquiry-form-screen";

export const metadata: Metadata = { title: "New enquiry" };

export default function Page() {
  return <EnquiryFormScreen />;
}
