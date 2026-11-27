import type { Metadata } from "next";

import { ClassesScreen } from "@/components/screens/classes-screen";

export const metadata: Metadata = { title: "Classes" };

export default function Page() {
  return <ClassesScreen />;
}
