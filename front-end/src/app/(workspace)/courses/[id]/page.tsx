import type { Metadata } from "next";
import { CourseDetails } from "@/components/screens/course-screen";

export const metadata: Metadata = { title: "Course details" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetails id={id} />;
}
