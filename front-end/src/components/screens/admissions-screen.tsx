"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { AdmissionStatusActions } from "@/components/admission-status";
import { DataTable, type AppColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatInr } from "@/lib/format";
import { accessLevel, canManageAdmissions, canRecordFees } from "@/lib/permissions";
import { balanceAmount, paidAmount, studentForAdmission } from "@/lib/records";
import { useAcademy } from "@/lib/store";
import type { Admission } from "@/lib/types";

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
  status: Admission["status"];
  admission: Admission;
}

export function AdmissionsScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "admissions", data.permissions) : "none";
  const manage = data.user ? canManageAdmissions(data.user.role, data.permissions) : false;
  const fees = data.user ? canRecordFees(data.user.role, data.permissions) : false;

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
          status: admission.status,
          admission,
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
      {
        accessorKey: "status",
        header: "Status",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
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
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-wrap justify-end gap-2" onClick={(event) => event.stopPropagation()}>
              {fees ? (
                <Button asChild size="sm" variant="outline" className="w-fit">
                  <Link href={`/admissions/${row.id}#fees`}>Record fee</Link>
                </Button>
              ) : null}
              <AdmissionStatusActions admission={row.admission} studentName={row.name} />
            </div>
          );
        },
      },
    ],
    [fees],
  );

  if (level === "none") return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Admissions"
        title="Fees and collections"
        description="Admit a student onto a batch, discontinue or complete them, and record the fees they pay."
        actions={
          manage ? (
            <Button asChild>
              <Link href="/admissions/new">New admission</Link>
            </Button>
          ) : null
        }
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
