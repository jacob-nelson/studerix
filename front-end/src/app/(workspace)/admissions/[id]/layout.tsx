import type { ReactNode } from "react";

import { AdmissionShell } from "@/components/screens/admission-shell";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdmissionShell id={id}>{children}</AdmissionShell>;
}
