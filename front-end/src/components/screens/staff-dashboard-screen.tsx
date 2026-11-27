"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DataTable, type AppColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { calendarYearBounds, periodBounds, weekdayLabel } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { attendanceTally } from "@/lib/records";
import { useAcademy } from "@/lib/store";
import { useStaffSearch } from "@/components/screens/staff-shell";
import { cn } from "@/lib/utils";
import type { AttendanceMark } from "@/lib/types";

type Span = "today" | "week" | "month" | "year";

const SPANS: { id: Span; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
];

type RosterStatus = AttendanceMark | "Not marked";

type RosterRow = {
  id: string;
  name: string;
  kind: string;
  status: RosterStatus;
  note: string;
  present: number;
  late: number;
  absent: number;
  rate: string;
  tests: number;
};

function boundsFor(span: Span) {
  const now = new Date();
  if (span === "year") return calendarYearBounds(now);
  return periodBounds(span, "", "", now);
}

export function StaffDashboardScreen() {
  const data = useAcademy();
  const { query } = useStaffSearch();
  const router = useRouter();
  const [span, setSpan] = useState<Span>("today");
  const bounds = boundsFor(span);
  const today = span === "today";

  const rows = useMemo<RosterRow[]>(() => {
    const statusOrder: Record<RosterStatus, number> = { Absent: 0, Late: 1, "Not marked": 2, Present: 3 };
    return data.staff
      .flatMap((person) => {
        const marks = person.attendance.filter((entry) => entry.date >= bounds.from && entry.date <= bounds.to);
        const tally = attendanceTally(marks);
        if (!person.active && tally.marked === 0) return [];
        const tests = data.tests.filter(
          (test) =>
            test.status !== "cancelled" &&
            test.staffId === person.id &&
            test.conductedOn >= bounds.from &&
            test.conductedOn <= bounds.to,
        ).length;
        const todayMark = marks.find((entry) => entry.date === bounds.from);
        const row: RosterRow = {
          id: person.id,
          name: person.name,
          kind: person.kind,
          status: today ? (todayMark?.status ?? "Not marked") : "Not marked",
          note: today ? todayMark?.note || "" : "",
          present: tally.present,
          late: tally.late,
          absent: tally.absent,
          rate: tally.rate === null ? "—" : `${tally.rate}%`,
          tests,
        };
        return [row];
      })
      .sort((a, b) =>
        today ? statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name) : b.absent - a.absent || a.name.localeCompare(b.name),
      );
  }, [bounds.from, bounds.to, data.staff, data.tests, today]);

  const markedDays = rows.reduce((sum, row) => sum + row.present + row.late + row.absent, 0);
  const attendedDays = rows.reduce((sum, row) => sum + row.present + row.late, 0);
  const rate = markedDays === 0 ? "—" : `${Math.round((attendedDays / markedDays) * 100)}%`;
  const cards = today
    ? [
        { label: "Present", value: String(rows.filter((row) => row.status === "Present").length) },
        { label: "Late", value: String(rows.filter((row) => row.status === "Late").length) },
        { label: "On leave", value: String(rows.filter((row) => row.status === "Absent").length) },
        { label: "Not marked", value: String(rows.filter((row) => row.status === "Not marked").length) },
        { label: "Attendance", value: rate },
      ]
    : [
        { label: "On leave", value: String(rows.filter((row) => row.absent > 0).length) },
        { label: "Were late", value: String(rows.filter((row) => row.late > 0).length) },
        { label: "No marks", value: String(rows.filter((row) => row.present + row.late + row.absent === 0).length) },
        { label: "Attendance", value: rate },
        { label: "Tests", value: String(rows.reduce((sum, row) => sum + row.tests, 0)) },
      ];

  const columns = useMemo<AppColumn<RosterRow>[]>(() => {
    const shared: AppColumn<RosterRow>[] = [
      {
        accessorKey: "name",
        header: "Name",
        sortFn: "text",
        cell: (info) => <span className="font-medium">{String(info.getValue())}</span>,
      },
      {
        accessorKey: "kind",
        header: "Type",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
    ];
    if (today) {
      return [
        ...shared,
        {
          accessorKey: "status",
          header: "Today",
          sortFn: "text",
          cell: (info) => <StatusBadge value={String(info.getValue())} />,
        },
        {
          accessorKey: "note",
          header: "Note",
          sortFn: "text",
          cell: (info) => String(info.getValue() || "—"),
        },
      ];
    }
    return [
      ...shared,
      { accessorKey: "present", header: "Present", sortFn: "basic" },
      { accessorKey: "late", header: "Late", sortFn: "basic" },
      { accessorKey: "absent", header: "Leave", sortFn: "basic" },
      { accessorKey: "rate", header: "Attendance", sortFn: "text" },
      { accessorKey: "tests", header: "Tests", sortFn: "basic" },
    ];
  }, [today]);

  const range =
    bounds.from === bounds.to
      ? `${weekdayLabel(bounds.from)} ${formatDate(bounds.from)}`
      : `${formatDate(bounds.from)} – ${formatDate(bounds.to)}`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-muted-foreground sm:mr-auto">{range}</p>
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {SPANS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSpan(option.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                span === option.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} size="sm">
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">{card.label}</p>
              <p className="text-sm font-medium tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <DataTable
        data={rows}
        columns={columns}
        filter={query}
        hideSearch
        pageSize={12}
        onRowClick={(row) => router.push(`/staff/${row.id}/attendance`)}
      />
    </div>
  );
}
