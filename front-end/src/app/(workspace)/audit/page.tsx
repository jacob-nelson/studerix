import type { Metadata } from "next";
import { AuditScreen } from "@/components/screens/audit-screen";

export const metadata: Metadata = { title: "Audit trail" };

export default function Page() {
  return <AuditScreen />;
}
