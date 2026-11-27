import { ROLES, type AccessLevel, type ModuleKey, type Role } from "@/lib/types";

export type PermissionMatrix = Record<Role, Record<ModuleKey, AccessLevel>>;

export const DEFAULT_MATRIX: PermissionMatrix = {
  Administrator: {
    dashboard: "write",
    enquiries: "write",
    courses: "write",
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
    courses: "write",
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
    courses: "read",
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
    courses: "read",
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
    courses: "read",
    admissions: "read",
    expenses: "read",
    placements: "read",
    consultancy: "read",
    reports: "write",
    staff: "read",
    audit: "read",
  },
  Faculty: {
    dashboard: "read",
    enquiries: "read",
    courses: "read",
    admissions: "read",
    expenses: "none",
    placements: "none",
    consultancy: "none",
    reports: "none",
    staff: "none",
    audit: "none",
  },
};

export const DEFAULT_EXPORT_ROLES: Role[] = ["Administrator", "Finance", "Management"];

export function copyPermissions(): PermissionMatrix {
  return ROLES.reduce((matrix, role) => {
    matrix[role] = { ...DEFAULT_MATRIX[role] };
    return matrix;
  }, {} as PermissionMatrix);
}

export function accessLevel(role: Role, module: ModuleKey, permissions: PermissionMatrix): AccessLevel {
  return permissions[role][module];
}

export function canExport(role: Role, exportRoles: readonly Role[]) {
  return exportRoles.includes(role);
}

export function canRecordFees(role: Role, permissions: PermissionMatrix) {
  return accessLevel(role, "admissions", permissions) === "write";
}

export function canManageCourses(role: Role, permissions: PermissionMatrix) {
  return accessLevel(role, "courses", permissions) === "write";
}

export function canManageAdmissions(role: Role, permissions: PermissionMatrix) {
  return (
    (role === "Administrator" || role === "Admissions") &&
    accessLevel(role, "admissions", permissions) !== "none"
  );
}

export const NAV_ITEMS: { href: string; label: string; module: ModuleKey; roles?: readonly Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", module: "dashboard" },
  { href: "/enquiries", label: "Enquiries", module: "enquiries" },
  { href: "/courses", label: "Courses", module: "courses" },
  { href: "/admissions", label: "Admissions & fees", module: "admissions" },
  { href: "/expenses", label: "Expenses", module: "expenses" },
  { href: "/placements", label: "Internal placements", module: "placements" },
  { href: "/consultancy", label: "Consultancy", module: "consultancy" },
  { href: "/reports", label: "Reports", module: "reports" },
  { href: "/staff", label: "Staff", module: "staff" },
  { href: "/audit", label: "Audit trail", module: "audit" },
];
