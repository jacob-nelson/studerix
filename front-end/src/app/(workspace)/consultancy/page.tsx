import type { Metadata } from "next";
import { ConsultancyScreen } from "@/components/screens/consultancy-screen";

export const metadata: Metadata = { title: "Consultancy" };

export default function Page() {
  return <ConsultancyScreen />;
}
