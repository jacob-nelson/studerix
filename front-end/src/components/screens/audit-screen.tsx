"use client";

import { useMemo, useState } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { OptionSelect } from "@/components/forms/option-select";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { formatDateTime } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";
import type { AuditEvent } from "@/lib/types";

export function AuditScreen() {
  const { audit, user } = useAcademy();
  const level = user ? accessLevel(user.role, "audit") : "none";
  const [module, setModule] = useState("all");
  const modules = useMemo(
    () => ["all", ...Array.from(new Set(audit.map((event) => event.module)))],
    [audit],
  );
  const rows = audit.filter((event) => module === "all" || event.module === module);

  const columns = useMemo<AppColumn<AuditEvent>[]>(
    () => [
      {
        accessorKey: "at",
        header: "When",
        sortFn: "alphanumeric",
        cell: (info) => formatDateTime(String(info.getValue())),
      },
      { accessorKey: "actor", header: "Who", sortFn: "text" },
      { accessorKey: "module", header: "Module", sortFn: "text" },
      { accessorKey: "action", header: "Action", sortFn: "text" },
      { accessorKey: "detail", header: "Detail", sortFn: "text" },
    ],
    [],
  );

  if (level === "none") return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Audit"
        title="Audit trail"
        description="Who changed what, including fee corrections. New entries from this session appear at the top."
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search the trail"
        searchAlign="end"
        initialSorting={[{ id: "at", desc: true }]}
        toolbar={
          <OptionSelect
            className="w-56"
            value={module}
            onChange={setModule}
            options={modules.map((item) => ({
              value: item,
              label: item === "all" ? "All modules" : item,
            }))}
          />
        }
      />
    </div>
  );
}
