import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/components/screens/forgot-password-screen";

export const metadata: Metadata = { title: "Forgot password" };

export default function Page() {
  return <ForgotPasswordScreen />;
}
