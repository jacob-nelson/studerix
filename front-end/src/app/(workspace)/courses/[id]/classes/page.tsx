import type { Metadata } from "next";

import { ClassesScreen } from "@/components/screens/classes-screen";

export const metadata: Metadata = { title: "Classes" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassesScreen courseId={id} />;
}
