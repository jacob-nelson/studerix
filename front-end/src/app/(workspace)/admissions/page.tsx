import type { Metadata } from "next";
import { AdmissionsScreen } from "@/components/screens/admissions-screen";

export const metadata: Metadata = { title: "Admissions and fees" };

export default function Page() {
  return <AdmissionsScreen />;
}
