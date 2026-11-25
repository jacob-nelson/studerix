"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { PeriodFilter } from "@/components/period-filter";
import { AccessDenied } from "@/components/states";
import { Button } from "@/components/ui/button";
import { inPeriod, periodBounds, type Period } from "@/lib/dates";
import { formatDate, formatInr } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";
import type { Expense } from "@/lib/types";

export function ExpensesScreen() {
  const { expenses, user, permissions } = useAcademy();
  const level = user ? accessLevel(user.role, "expenses", permissions) : "none";
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const bounds = periodBounds(period, from, to);
  const rows = expenses.filter((expense) => inPeriod(expense.date, bounds.from, bounds.to));
  const total = rows.reduce((sum, expense) => sum + expense.amount, 0);

  const columns = useMemo<AppColumn<Expense>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      { accessorKey: "purpose", header: "Purpose", sortFn: "text" },
      {
        accessorKey: "amount",
        header: "Amount",
        sortFn: "basic",
        cell: (info) => formatInr(Number(info.getValue())),
      },
      { accessorKey: "debitedBy", header: "Debited by", sortFn: "text" },
    ],
    [],
  );

  if (level === "none") return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Expenses"
        title="Expenses"
        description={`${formatInr(total)} in this period. Debited by is the staff member who approved or paid it.`}
        actions={
          level === "write" ? (
            <Button asChild>
              <Link href="/expenses/new">New expense</Link>
            </Button>
          ) : null
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search purpose or staff"
        searchAlign="end"
        toolbar={
          <PeriodFilter period={period} from={from} to={to} onPeriod={setPeriod} onFrom={setFrom} onTo={setTo} />
        }
        initialSorting={[{ id: "date", desc: true }]}
      />
    </div>
  );
}
