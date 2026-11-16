import type { Metadata } from "next";
import { ExpensesScreen } from "@/components/screens/expenses-screen";

export const metadata: Metadata = { title: "Expenses" };

export default function Page() {
  return <ExpensesScreen />;
}
