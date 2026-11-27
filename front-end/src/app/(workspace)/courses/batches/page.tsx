import type { Metadata } from "next";

import { BatchesScreen } from "@/components/screens/batches-screen";

export const metadata: Metadata = { title: "Batches" };

export default function Page() {
  return <BatchesScreen />;
}
