import type { Metadata } from "next";
import { CourseBatch } from "@/components/screens/course-screen";

export const metadata: Metadata = { title: "Batch" };

export default async function Page({ params }: { params: Promise<{ id: string; batchId: string }> }) {
  const { id, batchId } = await params;
  return <CourseBatch id={id} batchId={batchId} />;
}
