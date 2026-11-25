import type { Metadata } from "next";
import { CourseSyllabus } from "@/components/screens/course-screen";

export const metadata: Metadata = { title: "Syllabus" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseSyllabus id={id} />;
}
