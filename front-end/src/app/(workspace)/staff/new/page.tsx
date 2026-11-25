import type { Metadata } from "next";
import { StaffFormScreen } from "@/components/screens/staff-form-screen";

export const metadata: Metadata = { title: "Onboard staff" };

export default function Page() {
  return <StaffFormScreen />;
}
