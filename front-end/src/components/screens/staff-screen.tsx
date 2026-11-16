"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";
import type { StaffUser } from "@/lib/types";

export function StaffScreen() {
  const data = useAcademy();
  const level = data.user ? accessLevel(data.user.role, "staff") : "none";

  const columns = useMemo<AppColumn<StaffUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      { accessorKey: "email", header: "Email", sortFn: "text" },
      { accessorKey: "role", header: "Role", sortFn: "text" },
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

  if (level === "none") return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Access"
        title="Staff logins"
        description="Each person signs in separately. Leaving staff can be deactivated without deleting their history."
        actions={
          level === "write" ? (
            <Button asChild>
              <Link href="/staff/new">New login</Link>
            </Button>
          ) : null
        }
      />
      <DataTable data={data.staff} columns={columns} searchPlaceholder="Search staff" />
      <Card>
        <CardHeader>
          <CardTitle>What each role can change</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Role</th>
                <th className="py-2 font-medium">Enquiries</th>
                <th className="py-2 font-medium">Fees</th>
                <th className="py-2 font-medium">Expenses</th>
                <th className="py-2 font-medium">Placements</th>
                <th className="py-2 font-medium">Consultancy</th>
                <th className="py-2 font-medium">Export</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Administrator", "Edit", "Edit", "Edit", "Edit", "Edit", "Yes"],
                ["Admissions", "Edit", "View", "—", "View", "—", "—"],
                ["Finance", "View", "Edit", "Edit", "—", "Edit", "Yes"],
                ["Placement", "View", "View", "—", "Edit", "Edit", "—"],
                ["Management", "View", "View", "View", "View", "View", "Yes"],
              ].map((row) => (
                <tr key={row[0]} className="border-t">
                  {row.map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className="py-2 pr-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
