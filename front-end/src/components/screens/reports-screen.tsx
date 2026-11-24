"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type AppColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { PeriodFilter } from "@/components/period-filter";
import { AccessDenied } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCsv } from "@/lib/csv";
import { inPeriod, periodBounds, type Period } from "@/lib/dates";
import { formatDate, formatInr } from "@/lib/format";
import { accessLevel, canExport } from "@/lib/permissions";
import { paymentRows, studentForAdmission } from "@/lib/records";
import { useAcademy } from "@/lib/store";

function ReportFilters({
  period,
  from,
  to,
  onPeriod,
  onFrom,
  onTo,
}: {
  period: Period;
  from: string;
  to: string;
  onPeriod: (period: Period) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <>
      <PeriodFilter period={period} from={from} to={to} onPeriod={onPeriod} onFrom={onFrom} onTo={onTo} />
      <TabsList>
        <TabsTrigger value="collections">Collections</TabsTrigger>
        <TabsTrigger value="admissions">Admissions</TabsTrigger>
        <TabsTrigger value="placements">Placements</TabsTrigger>
      </TabsList>
    </>
  );
}

export function ReportsScreen() {
  const data = useAcademy();
  const level = data.user ? accessLevel(data.user.role, "reports") : "none";
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState("collections");
  const bounds = periodBounds(period, from, to);
  const allowed = data.user ? canExport(data.user.role) : false;

  const collections = useMemo(
    () =>
      paymentRows(data)
        .filter((row) => inPeriod(row.date, bounds.from, bounds.to))
        .map((row) => ({ ...row, amountLabel: formatInr(row.signedAmount) })),
    [data, bounds.from, bounds.to],
  );
  const admissions = useMemo(
    () =>
      data.admissions
        .filter((item) => inPeriod(item.joinedOn, bounds.from, bounds.to))
        .map((item) => ({
          id: item.id,
          name: studentForAdmission(data, item).name,
          course: studentForAdmission(data, item).course,
          batch: item.batch,
          joinedOn: item.joinedOn,
        })),
    [data, bounds.from, bounds.to],
  );
  const placements = useMemo(
    () =>
      data.placements
        .filter((item) => inPeriod(item.updatedOn, bounds.from, bounds.to))
        .map((item) => {
          const admission = data.admissions.find((entry) => entry.id === item.admissionId);
          return {
            id: item.id,
            name: admission ? studentForAdmission(data, admission).name : "Unknown",
            status: item.status,
            company: item.company || "—",
            salary: item.salary || "—",
            updatedOn: item.updatedOn,
          };
        }),
    [data, bounds.from, bounds.to],
  );

  const collectionColumns = useMemo<AppColumn<(typeof collections)[number]>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      { accessorKey: "person", header: "Person", sortFn: "text" },
      { accessorKey: "context", header: "Context", sortFn: "text" },
      {
        accessorKey: "kind",
        header: "Kind",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
      { accessorKey: "mode", header: "Mode", sortFn: "text" },
      { accessorKey: "amountLabel", header: "Amount", enableSorting: false },
      { accessorKey: "receivedBy", header: "Received by", sortFn: "text" },
    ],
    [],
  );
  const admissionColumns = useMemo<AppColumn<(typeof admissions)[number]>[]>(
    () => [
      { accessorKey: "name", header: "Student", sortFn: "text" },
      { accessorKey: "course", header: "Course", sortFn: "text" },
      { accessorKey: "batch", header: "Batch", sortFn: "text" },
      {
        accessorKey: "joinedOn",
        header: "Joined",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
    ],
    [],
  );
  const placementColumns = useMemo<AppColumn<(typeof placements)[number]>[]>(
    () => [
      { accessorKey: "name", header: "Student", sortFn: "text" },
      {
        accessorKey: "status",
        header: "Status",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
      { accessorKey: "company", header: "Company", sortFn: "text" },
      { accessorKey: "salary", header: "Salary", sortFn: "text" },
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

  function exportCurrent() {
    if (!allowed) return;
    if (tab === "collections") {
      downloadCsv("collections.csv", [
        ["Date", "Person", "Context", "Kind", "Mode", "Amount", "Received by"],
        ...collections.map((row) => [
          row.date,
          row.person,
          row.context,
          row.kind,
          row.mode,
          String(row.signedAmount),
          row.receivedBy,
        ]),
      ]);
    } else if (tab === "admissions") {
      downloadCsv("admissions.csv", [
        ["Student", "Course", "Batch", "Joined"],
        ...admissions.map((row) => [row.name, row.course, row.batch, row.joinedOn]),
      ]);
    } else {
      downloadCsv("placements.csv", [
        ["Student", "Status", "Company", "Salary", "Updated"],
        ...placements.map((row) => [row.name, row.status, row.company, row.salary, row.updatedOn]),
      ]);
    }
    toast.success("Export downloaded");
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Reports"
        title="Collections, admissions and placements"
        description="Choose a period, then export the visible rows. Export is limited to finance, management and administrators."
        actions={
          <Button type="button" variant="outline" disabled={!allowed} onClick={exportCurrent}>
            Export CSV
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsContent value="collections">
          <DataTable
            data={collections}
            columns={collectionColumns}
            searchPlaceholder="Search payments"
            searchAlign="end"
            toolbar={<ReportFilters period={period} from={from} to={to} onPeriod={setPeriod} onFrom={setFrom} onTo={setTo} />}
          />
        </TabsContent>
        <TabsContent value="admissions">
          <DataTable
            data={admissions}
            columns={admissionColumns}
            searchPlaceholder="Search admissions"
            searchAlign="end"
            toolbar={<ReportFilters period={period} from={from} to={to} onPeriod={setPeriod} onFrom={setFrom} onTo={setTo} />}
          />
        </TabsContent>
        <TabsContent value="placements">
          <DataTable
            data={placements}
            columns={placementColumns}
            searchPlaceholder="Search placements"
            searchAlign="end"
            toolbar={<ReportFilters period={period} from={from} to={to} onPeriod={setPeriod} onFrom={setFrom} onTo={setTo} />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
