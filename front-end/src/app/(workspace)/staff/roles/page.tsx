import type { Metadata } from "next";
import { StaffRoles } from "@/components/screens/staff-screen";
import { StaffShell } from "@/components/screens/staff-shell";

export const metadata: Metadata = { title: "Staff roles" };

export default function Page() {
  return (
    <StaffShell>
      <StaffRoles />
    </StaffShell>
  );
}
