import type { Metadata } from "next";
import { AdmissionFormScreen } from "@/components/screens/admission-form-screen";

export const metadata: Metadata = { title: "New admission" };

export default function Page() {
  return <AdmissionFormScreen />;
}
