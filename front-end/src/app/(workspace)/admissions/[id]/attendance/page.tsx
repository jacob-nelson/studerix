import type { Metadata } from "next";

import { AdmissionAttendance } from "@/components/screens/admission-attendance-screen";

export const metadata: Metadata = { title: "Attendance" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdmissionAttendance id={id} />;
}
