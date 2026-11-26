import type { Metadata } from "next";

import { StaffSalaryScreen } from "@/components/screens/staff-salary-screen";

export const metadata: Metadata = { title: "Salary" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffSalaryScreen id={id} />;
}
