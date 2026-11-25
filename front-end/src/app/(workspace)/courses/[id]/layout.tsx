import type { ReactNode } from "react";
import { CourseShell } from "@/components/screens/course-shell";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseShell id={id}>{children}</CourseShell>;
}
