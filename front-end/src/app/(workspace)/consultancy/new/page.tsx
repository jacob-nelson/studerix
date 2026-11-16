import type { Metadata } from "next";
import { ConsultancyFormScreen } from "@/components/screens/consultancy-form-screen";

export const metadata: Metadata = { title: "New candidate" };

export default function Page() {
  return <ConsultancyFormScreen />;
}
