import type { Metadata } from "next";
import { StaffScreen } from "@/components/screens/staff-screen";
import { StaffShell } from "@/components/screens/staff-shell";

export const metadata: Metadata = { title: "Staff" };

export default function Page() {
  return (
    <StaffShell>
      <StaffScreen />
    </StaffShell>
  );
}
