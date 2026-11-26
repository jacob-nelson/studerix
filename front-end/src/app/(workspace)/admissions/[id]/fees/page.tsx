import type { Metadata } from "next";

import { AdmissionFees } from "@/components/screens/admission-fees-screen";

export const metadata: Metadata = { title: "Fees" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdmissionFees id={id} />;
}
