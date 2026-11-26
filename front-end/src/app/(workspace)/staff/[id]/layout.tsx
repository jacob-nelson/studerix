import type { ReactNode } from "react";

import { StaffMemberShell } from "@/components/screens/staff-member-shell";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffMemberShell id={id}>{children}</StaffMemberShell>;
}
