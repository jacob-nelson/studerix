import type { Metadata } from "next";
import { ReportsScreen } from "@/components/screens/reports-screen";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return <ReportsScreen />;
}
