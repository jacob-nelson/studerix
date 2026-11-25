import type { Metadata } from "next";
import { CourseBatches } from "@/components/screens/course-screen";

export const metadata: Metadata = { title: "Batches" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseBatches id={id} />;
}