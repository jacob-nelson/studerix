import type { Metadata } from "next";
import { PlacementScreen } from "@/components/screens/placement-screen";

export const metadata: Metadata = { title: "Placement" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlacementScreen id={id} />;
}
