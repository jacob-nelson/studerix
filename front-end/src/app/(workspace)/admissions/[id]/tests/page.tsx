import type { Metadata } from "next";

import { AdmissionTests } from "@/components/screens/admission-tests-screen";

export const metadata: Metadata = { title: "Tests" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdmissionTests id={id} />;
}
