import type { Metadata } from "next";
import { CoursesScreen } from "@/components/screens/courses-screen";

export const metadata: Metadata = { title: "Courses" };

export default function Page() {
  return <CoursesScreen />;
}
