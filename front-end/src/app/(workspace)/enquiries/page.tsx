import type { Metadata } from "next";
import { EnquiriesScreen } from "@/components/screens/enquiries-screen";

export const metadata: Metadata = { title: "Enquiries" };

export default function Page() {
  return <EnquiriesScreen />;
}
