import type { Metadata } from "next";
import { PlacementsScreen } from "@/components/screens/placements-screen";

export const metadata: Metadata = { title: "Internal placements" };

export default function Page() {
  return <PlacementsScreen />;
}
