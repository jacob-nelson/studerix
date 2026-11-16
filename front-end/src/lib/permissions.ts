import type { AccessLevel, ModuleKey, Role } from "@/lib/types";

const MATRIX: Record<Role, Record<ModuleKey, AccessLevel>> = {
  Administrator: {
    dashboard: "write",
    enquiries: "write",
    admissions: "write",
    expenses: "write",
    placements: "write",
    consultancy: "write",
    reports: "write",
    staff: "write",
    audit: "read",
  },
  Admissions: {
    dashboard: "read",
    enquiries: "write",
    admissions: "read",
    expenses: "none",
    placements: "read",
    consultancy: "none",
    reports: "read",
    staff: "none",
    audit: "none",
  },
  Finance: {
    dashboard: "read",
    enquiries: "read",
    admissions: "write",
    expenses: "write",
    placements: "none",
    consultancy: "write",
    reports: "write",
    staff: "none",
    audit: "read",
  },
  Placement: {
    dashboard: "read",
    enquiries: "read",
    admissions: "read",
    expenses: "none",
    placements: "write",
    consultancy: "write",
    reports: "read",
    staff: "none",
    audit: "none",
  },
  Management: {
    dashboard: "read",
    enquiries: "read",
    admissions: "read",
    expenses: "read",
    placements: "read",
    consultancy: "read",
    reports: "write",
    staff: "read",
    audit: "read",
  },
};

export function accessLevel(role: Role, module: ModuleKey): AccessLevel {
  return MATRIX[role][module];
}

export function canExport(role: Role) {
  return role === "Administrator" || role === "Finance" || role === "Management";
}

export function canRecordFees(role: Role) {
  return role === "Administrator" || role === "Finance";
}

export const NAV_ITEMS: { href: string; label: string; module: ModuleKey }[] = [
  { href: "/dashboard", label: "Dashboard", module: "dashboard" },
  { href: "/enquiries", label: "Enquiries", module: "enquiries" },
  { href: "/admissions", label: "Admissions & fees", module: "admissions" },
  { href: "/expenses", label: "Expenses", module: "expenses" },
  { href: "/placements", label: "Internal placements", module: "placements" },
  { href: "/consultancy", label: "Consultancy", module: "consultancy" },
  { href: "/reports", label: "Reports", module: "reports" },
  { href: "/staff", label: "Staff access", module: "staff" },
  { href: "/audit", label: "Audit trail", module: "audit" },
];
