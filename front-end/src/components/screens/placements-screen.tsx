"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatPhone } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { studentForAdmission } from "@/lib/records";
import { useAcademy } from "@/lib/store";

interface PlacementRow {
  id: string;
  name: string;
  contact: string;
  email: string;
  mockRank: string;
  company: string;
  salary: string;
  status: string;
  updatedOn: string;
}

export function PlacementsScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "placements", data.permissions) : "none";
  const rows = useMemo<PlacementRow[]>(
    () =>
      data.placements.map((placement) => {
        const admission = data.admissions.find((item) => item.id === placement.admissionId);
        const student = admission
          ? studentForAdmission(data, admission)
          : { name: "Unknown", contact: "", email: "", course: "", source: "" };
        return {
          id: placement.id,
          name: student.name,
          contact: student.contact,
          email: student.email,
          mockRank: placement.mockRank,
          company: placement.company || "—",
          salary: placement.salary || "—",
          status: placement.status,
          updatedOn: placement.updatedOn,
        };
      }),
    [data],
  );

  const columns = useMemo<AppColumn<PlacementRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Student",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      {
        accessorKey: "contact",
        header: "Contact",
        enableSorting: false,
        cell: (info) => formatPhone(String(info.getValue())),
      },
      { accessorKey: "email", header: "Email", sortFn: "text" },
      { accessorKey: "mockRank", header: "Mock rank", sortFn: "text" },
      { accessorKey: "company", header: "Company", sortFn: "text" },
      { accessorKey: "salary", header: "Salary", sortFn: "text" },
      {
        accessorKey: "status",
        header: "Status",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
      {
        accessorKey: "updatedOn",
        header: "Updated",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
    ],
    [],
  );

  if (level === "none") return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Placements"
        title="Internal placements"
        description="Students who joined a Software Testing course appear here on their own. Name, phone and email come from that record."
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search students, companies or ranks"
        initialSorting={[{ id: "updatedOn", desc: true }]}
        onRowClick={(row) => router.push(`/placements/${row.id}`)}
      />
    </div>
  );
}
