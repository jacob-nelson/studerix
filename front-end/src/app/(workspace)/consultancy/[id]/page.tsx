import type { Metadata } from "next";
import { ConsultancyDetailScreen } from "@/components/screens/consultancy-detail-screen";

export const metadata: Metadata = { title: "Consultancy candidate" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConsultancyDetailScreen id={id} />;
}
