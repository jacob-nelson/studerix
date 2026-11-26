"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Shield } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { accessLevel, type PermissionMatrix } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";
import { ROLES, type ModuleKey, type Role, type StaffUser } from "@/lib/types";

export function StaffScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";

  const columns = useMemo<AppColumn<StaffUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      { accessorKey: "kind", header: "Type", sortFn: "text", cell: (info) => <StatusBadge value={String(info.getValue())} /> },
      { accessorKey: "email", header: "Email", sortFn: "text" },
      { accessorKey: "role", header: "Desk role", sortFn: "text" },
      {
        id: "state",
        header: "Status",
        accessorFn: (row) => (row.active ? "Active" : "Inactive"),
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        cell: (info) => {
          if (level !== "write" || !data.user) return null;
          const person = info.row.original;
          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                const result = data.setStaffActive(person.id, !person.active, data.user!.name);
                if (!result.ok) toast.error(result.message);
                else toast.success(person.active ? "Login deactivated" : "Login restored");
              }}
            >
              {person.active ? "Deactivate" : "Restore"}
            </Button>
          );
        },
      },
    ],
    [data, level],
  );

  if (level === "none" || !data.user) return null;

  return (
    <DataTable
      data={data.staff}
      columns={columns}
      searchPlaceholder="Search staff"
      onRowClick={(person) => router.push(`/staff/${person.id}`)}
    />
  );
}

type PermissionRow =
  | { id: string; label: string; kind: "view" | "edit"; module: ModuleKey }
  | { id: string; label: string; kind: "export" };

const PERMISSION_ROWS: PermissionRow[] = [
  { id: "view-dashboard", label: "View dashboard", kind: "view", module: "dashboard" },
  { id: "view-enquiries", label: "View enquiries", kind: "view", module: "enquiries" },
  { id: "edit-enquiries", label: "Edit enquiries", kind: "edit", module: "enquiries" },
  { id: "view-courses", label: "View courses", kind: "view", module: "courses" },
  { id: "edit-courses", label: "Edit courses", kind: "edit", module: "courses" },
  { id: "view-fees", label: "View fees", kind: "view", module: "admissions" },
  { id: "record-fees", label: "Record fees", kind: "edit", module: "admissions" },
  { id: "view-expenses", label: "View expenses", kind: "view", module: "expenses" },
  { id: "record-expenses", label: "Record expenses", kind: "edit", module: "expenses" },
  { id: "view-placements", label: "View placements", kind: "view", module: "placements" },
  { id: "edit-placements", label: "Edit placements", kind: "edit", module: "placements" },
  { id: "view-consultancy", label: "View consultancy", kind: "view", module: "consultancy" },
  { id: "edit-consultancy", label: "Edit consultancy", kind: "edit", module: "consultancy" },
  { id: "view-reports", label: "View reports", kind: "view", module: "reports" },
  { id: "export-reports", label: "Export reports", kind: "export" },
  { id: "view-staff", label: "View staff", kind: "view", module: "staff" },
  { id: "edit-staff", label: "Edit staff", kind: "edit", module: "staff" },
  { id: "view-audit", label: "View audit trail", kind: "view", module: "audit" },
];

function clonePermissions(source: PermissionMatrix): PermissionMatrix {
  return ROLES.reduce((matrix, role) => {
    matrix[role] = { ...source[role] };
    return matrix;
  }, {} as PermissionMatrix);
}

function samePermissions(left: PermissionMatrix, right: PermissionMatrix) {
  return ROLES.every((role) =>
    (Object.keys(left[role]) as ModuleKey[]).every((module) => left[role][module] === right[role][module]),
  );
}

function sameExports(left: readonly Role[], right: readonly Role[]) {
  if (left.length !== right.length) return false;
  const sorted = [...left].sort();
  return [...right].sort().every((role, index) => role === sorted[index]);
}

function isChecked(row: PermissionRow, role: Role, permissions: PermissionMatrix, exportRoles: readonly Role[]) {
  if (role === "Administrator") return true;
  if (row.kind === "export") return exportRoles.includes(role);
  const access = permissions[role][row.module];
  return row.kind === "edit" ? access === "write" : access !== "none";
}

export function StaffRoles() {
  const data = useAcademy();
  const level = data.user ? accessLevel(data.user.role, "staff", data.permissions) : "none";
  const [draftPermissions, setDraftPermissions] = useState(() => clonePermissions(data.permissions));
  const [draftExports, setDraftExports] = useState<Role[]>(() => [...data.exportRoles]);
  if (level === "none" || !data.user) return null;
  const editable = level === "write";
  const dirty =
    !samePermissions(draftPermissions, data.permissions) || !sameExports(draftExports, data.exportRoles);

  function toggle(role: Role, row: PermissionRow, checked: boolean) {
    if (!editable || role === "Administrator") return;
    if (row.kind === "export") {
      setDraftExports((current) =>
        checked ? [...current, role] : current.filter((item) => item !== role),
      );
      return;
    }
    setDraftPermissions((current) => {
      const next = clonePermissions(current);
      const access = next[role][row.module];
      if (row.kind === "edit") next[role][row.module] = checked ? "write" : access === "none" ? "none" : "read";
      else next[role][row.module] = checked ? (access === "write" ? "write" : "read") : "none";
      return next;
    });
  }

  function save() {
    const result = data.saveRolePermissions(draftPermissions, draftExports, data.user!.name);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Role permissions saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-4" />
          Role permissions
        </CardTitle>
        <CardDescription>
          Configure what each role can do. Administrator has full access and cannot be modified.
        </CardDescription>
        {editable ? (
          <CardAction>
            <Button type="button" className="w-fit" disabled={!dirty} onClick={save}>
              <Save />
              Save changes
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-xs tracking-wide text-muted-foreground uppercase">
              <th className="border-b px-3 py-2 font-medium">Permission</th>
              {ROLES.map((role) => (
                <th key={role} className="border-b px-2 py-2 text-center font-medium">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_ROWS.map((row, index) => (
              <tr key={row.id} className={index % 2 === 1 ? "bg-muted/40" : undefined}>
                <td className="px-3 py-2.5">{row.label}</td>
                {ROLES.map((role) => {
                  const checked = isChecked(row, role, draftPermissions, draftExports);
                  const locked = !editable || role === "Administrator";
                  return (
                    <td key={role} className="px-2 py-2.5 text-center">
                      <Checkbox
                        className="mx-auto"
                        checked={checked}
                        disabled={locked}
                        aria-label={`${row.label} for ${role}`}
                        onCheckedChange={(value) => toggle(role, row, value === true)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
