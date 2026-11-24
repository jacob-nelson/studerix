"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, type AppColumn } from "@/components/data-table";
import { OptionSelect } from "@/components/forms/option-select";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPhone } from "@/lib/format";
import { accessLevel } from "@/lib/permissions";
import { useAcademy } from "@/lib/store";
import { COURSES, ENQUIRY_STATUSES, type Enquiry } from "@/lib/types";

export function EnquiriesScreen() {
  const { enquiries, user } = useAcademy();
  const router = useRouter();
  const [status, setStatus] = useState("all");
  const [course, setCourse] = useState("all");
  const level = user ? accessLevel(user.role, "enquiries") : "none";

  const rows = useMemo(
    () =>
      enquiries.filter(
        (enquiry) =>
          (status === "all" || enquiry.status === status) &&
          (course === "all" || enquiry.course === course),
      ),
    [enquiries, status, course],
  );

  const columns = useMemo<AppColumn<Enquiry>[]>(
    () => [
      {
        accessorKey: "enquiryDate",
        header: "Date",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue())),
      },
      {
        accessorKey: "studentName",
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
      { accessorKey: "course", header: "Course", sortFn: "text" },
      { accessorKey: "source", header: "Source", sortFn: "text" },
      {
        id: "group",
        header: "Group",
        accessorFn: (row) => (row.groupAdded ? "Added" : "Not added"),
        sortFn: "text",
      },
      {
        accessorKey: "status",
        header: "Status",
        sortFn: "text",
        cell: (info) => <StatusBadge value={String(info.getValue())} />,
      },
      {
        accessorKey: "followUpDate",
        header: "Follow-up",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue() ?? "")),
      },
      {
        accessorKey: "nextActionDate",
        header: "Next action",
        sortFn: "alphanumeric",
        cell: (info) => formatDate(String(info.getValue() ?? "")),
      },
    ],
    [],
  );

  if (level === "none") return <AccessDenied />;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Enquiries"
        title="Enquiry register"
        description="Search by student, phone, course or status. Open a row to follow up or mark them Joined."
        actions={
          level === "write" ? (
            <Button asChild>
              <Link href="/enquiries/new">New enquiry</Link>
            </Button>
          ) : null
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search enquiries"
        toolbar={
          <>
            <OptionSelect
              className="w-44"
              value={status}
              onChange={setStatus}
              options={[{ value: "all", label: "All statuses" }, ...ENQUIRY_STATUSES]}
            />
            <OptionSelect
              className="w-56"
              value={course}
              onChange={setCourse}
              options={[{ value: "all", label: "All courses" }, ...COURSES]}
            />
          </>
        }
        initialSorting={[{ id: "enquiryDate", desc: true }]}
        onRowClick={(row) => router.push(`/enquiries/${row.id}`)}
      />
    </div>
  );
}
