"use client";

import { StaffPay } from "@/components/screens/staff-pay";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";

export function StaffSalaryScreen({ id }: { id: string }) {
  const data = useAcademy();
  const person = data.staff.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";
  if (!person || !data.user) return null;
  return <StaffPay person={person} canWrite={level === "write"} />;
}
