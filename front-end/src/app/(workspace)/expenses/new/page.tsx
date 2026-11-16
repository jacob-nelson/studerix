import type { Metadata } from "next";
import { ExpenseFormScreen } from "@/components/screens/expense-form-screen";

export const metadata: Metadata = { title: "New expense" };

export default function Page() {
  return <ExpenseFormScreen />;
}
