"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { HeaderSearch, PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatInr } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { balanceAmount, paidAmount } from "@/lib/records";
import { useAcademy } from "@/lib/store";

interface ConsultancyRow {
  id: string;
  name: string;
  progress: string;
  company: string;
  agreed: number;
  paid: number;
  balance: number;
  addedOn: string;
}

export function ConsultancyScreen() {
  const data = useAcademy();
  const router = useRouter();
  const level = data.user ? accessLevel(data.user.role, "consultancy", data.permissions) : "none";
  const [query, setQuery] = useState("");
  const rows = useMemo<ConsultancyRow[]>(
    () =>
      data.consultancy.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        progress: candidate.progress,
        company: candidate.company || "—",
        agreed: candidate.agreedFee,
        paid: paidAmount(candidate.collections),
        balance: balanceAmount(candidate.agreedFee, candidate.collections),
        addedOn: candidate.addedOn,
      })),
    [data.consultancy],
  );

  const columns = useMemo<AppColumn<ConsultancyRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Candidate",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      {
        accessorKey: "progress",
        header: "Progress",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
      { accessorKey: "company", header: "Company", sortFn: "text" },
      {
        accessorKey: "agreed",
        header: "Agreed fee",
        sortFn: "basic",
        cell: (info) => formatInr(Number(info.getValue())),
      },
      {
        accessorKey: "paid",
        header: "Collected",
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
        accessorKey: "addedOn",
        header: "Added",
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
        eyebrow="Consultancy"
        title="Consultancy placements"
        description="External candidates are added here directly. They do not need a course admission."
        actions={
          <HeaderSearch
            action={
              level === "write" ? (
                <Button asChild>
                  <Link href="/consultancy/new">New candidate</Link>
                </Button>
              ) : null
            }
            value={query}
            onChange={setQuery}
            placeholder="Search candidates or companies"
          />
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        filter={query}
        initialSorting={[{ id: "addedOn", desc: true }]}
        onRowClick={(row) => router.push(`/consultancy/${row.id}`)}
      />
    </div>
  );
}
