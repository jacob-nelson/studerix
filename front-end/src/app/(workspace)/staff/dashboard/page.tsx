import type { Metadata } from "next";

import { StaffDashboardScreen } from "@/components/screens/staff-dashboard-screen";
import { StaffShell } from "@/components/screens/staff-shell";

export const metadata: Metadata = { title: "Staff dashboard" };

export default function Page() {
  return (
    <StaffShell>
      <StaffDashboardScreen />
    </StaffShell>
  );
}
