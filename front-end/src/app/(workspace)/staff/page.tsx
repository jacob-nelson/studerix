import type { Metadata } from "next";
import { StaffScreen } from "@/components/screens/staff-screen";

export const metadata: Metadata = { title: "Staff access" };

export default function Page() {
  return <StaffScreen />;
}
