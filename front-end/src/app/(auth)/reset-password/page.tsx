import type { Metadata } from "next";
import { ResetPasswordScreen } from "@/components/screens/reset-password-screen";

export const metadata: Metadata = { title: "Reset password" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  return <ResetPasswordScreen email={email} />;
}
