import type { Metadata } from "next";
import { CourseFormScreen } from "@/components/screens/course-form-screen";

export const metadata: Metadata = { title: "New course" };

export default function Page() {
  return <CourseFormScreen />;
}
