import type { Metadata } from "next";
import { CourseFees } from "@/components/screens/course-screen";

export const metadata: Metadata = { title: "Fee plans" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseFees id={id} />;
}
