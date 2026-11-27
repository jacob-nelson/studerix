import type { Metadata } from "next";

import { TestsScreen } from "@/components/screens/tests-screen";

export const metadata: Metadata = { title: "Tests" };

export default function Page() {
  return <TestsScreen />;
}
