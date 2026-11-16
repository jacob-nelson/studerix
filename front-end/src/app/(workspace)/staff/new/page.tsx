import type { Metadata } from "next";
import { StaffFormScreen } from "@/components/screens/staff-form-screen";

export const metadata: Metadata = { title: "New staff login" };

export default function Page() {
  return <StaffFormScreen />;
}
