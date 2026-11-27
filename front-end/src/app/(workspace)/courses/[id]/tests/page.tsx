import type { Metadata } from "next";

import { TestsScreen } from "@/components/screens/tests-screen";

export const metadata: Metadata = { title: "Tests" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestsScreen courseId={id} />;
}
