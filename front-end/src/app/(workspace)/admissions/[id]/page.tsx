import type { Metadata } from "next";
import { AdmissionScreen } from "@/components/screens/admission-screen";

export const metadata: Metadata = { title: "Fee record" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdmissionScreen id={id} />;
}
