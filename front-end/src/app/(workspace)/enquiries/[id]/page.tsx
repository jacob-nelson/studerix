import type { Metadata } from "next";
import { EnquiryScreen } from "@/components/screens/enquiry-screen";

export const metadata: Metadata = { title: "Enquiry" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EnquiryScreen id={id} />;
}
