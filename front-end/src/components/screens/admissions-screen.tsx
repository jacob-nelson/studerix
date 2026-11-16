"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { formatDate, formatInr } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { balanceAmount, paidAmount, studentForAdmission } from "@/lib/records";
import { useAcademy } from "@/lib/store";

interface FeeRow {
  id: string;
  name: string;
  batch: string;
  course: string;
  source: string;
  agreed: number;
  paid: number;
  balance: number;
  joinedOn: string;
}

export function AdmissionsScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "admissions") : "none";

  const rows = useMemo<FeeRow[]>(
    () =>
      data.admissions.map((admission) => {
        const student = studentForAdmission(data, admission);
        return {
          id: admission.id,
          name: student.name,
          batch: admission.batch,
          course: student.course,
          source: student.source,
          agreed: admission.agreedFee,
          paid: paidAmount(admission.instalments),
          balance: balanceAmount(admission.agreedFee, admission.instalments),
          joinedOn: admission.joinedOn,
        };
      }),
    [data],
  );

  const columns = useMemo<AppColumn<FeeRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Student",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      { accessorKey: "batch", header: "Batch", sortFn: "text" },
      { accessorKey: "course", header: "Course", sortFn: "text" },
      { accessorKey: "source", header: "Source", sortFn: "text" },
      {
        accessorKey: "agreed",
        header: "Agreed",
        sortFn: "basic",
        cell: (info) => formatInr(Number(info.getValue())),
      },
      {
        accessorKey: "paid",
        header: "Paid",
        sortFn: "basic",
        cell: (info) => formatInr(Number(info.getValue())),
      },
      {
        accessorKey: "balance",
        header: "Balance",
        sortFn: "basic",
        cell: (info) => formatInr(Number(info.getValue())),
      },
      {
        accessorKey: "joinedOn",
        header: "Joined",
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
        eyebrow="Admissions"
        title="Fees and collections"
        description="Students appear here after an enquiry is marked Joined. Paid and balance come from the instalments."
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search students, batches or courses"
        initialSorting={[{ id: "joinedOn", desc: true }]}
        onRowClick={(row) => router.push(`/admissions/${row.id}`)}
      />
    </div>
  );
}
