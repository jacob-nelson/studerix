import type { Metadata } from "next";

import { StaffProfileScreen } from "@/components/screens/staff-profile-screen";

export const metadata: Metadata = { title: "Staff profile" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffProfileScreen id={id} />;
}
