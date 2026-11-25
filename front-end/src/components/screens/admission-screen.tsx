"use client";

import Link from "next/link";
import { toast } from "sonner";

import { AdmissionStatusActions } from "@/components/admission-status";
import { Facts } from "@/components/facts";
import { LedgerForm } from "@/components/forms/ledger-form";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatInr, formatPhone } from "@/lib/format";
import { accessLevel, canRecordFees } from "@/lib/permissions";
import { balanceAmount, paidAmount, scheduleAmounts, studentForAdmission } from "@/lib/records";
import { useAcademy } from "@/lib/store";

export function AdmissionScreen({ id }: { id: string }) {
  const data = useAcademy();
  const admission = data.admissions.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "admissions", data.permissions) : "none";

  if (level === "none") return <AccessDenied />;
  if (!admission || !data.user) return <MissingRecord href="/admissions" label="Back to fees" />;

  const student = studentForAdmission(data, admission);
  const paid = paidAmount(admission.instalments);
  const balance = balanceAmount(admission.agreedFee, admission.instalments);
  const width = admission.agreedFee > 0 ? Math.min(100, Math.max(0, (paid / admission.agreedFee) * 100)) : 0;
  const placement = data.placements.find((item) => item.admissionId === admission.id);
  const batch = data.batches.find((item) => item.id === admission.batchId);
  const fees = canRecordFees(data.user.role, data.permissions);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow={admission.id}
        title={student.name}
        description={`${student.course} · ${admission.batch}`}
        actions={
          <>
            <StatusBadge value={admission.status} />
            <AdmissionStatusActions admission={admission} studentName={student.name} />
            <Button asChild variant="outline">
              <Link href={`/enquiries/${admission.enquiryId}`}>Enquiry</Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Fee position</CardTitle>
          <CardDescription>
            Paid {formatInr(paid)} of {formatInr(admission.agreedFee)}. Balance updates as entries are added.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${width}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Agreed</p>
              <p className="tabular-nums">{formatInr(admission.agreedFee)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="tabular-nums">{formatInr(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="tabular-nums">{formatInr(balance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment schedule</CardTitle>
          <CardDescription>
            {admission.feePlanName || "No plan was chosen for this admission."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admission.feeSchedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Fee plans are defined on the course. Choose one when the student is admitted.
            </p>
          ) : (
            <ul className="grid gap-2">
              {scheduleAmounts(admission.agreedFee, admission.feeSchedule).map((part) => (
                <li key={`${part.label}-${part.percent}`} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {part.label}
                    <span className="ml-2 text-muted-foreground">{part.percent}%</span>
                  </span>
                  <span className="tabular-nums">{formatInr(part.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Student record</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Facts
            items={[
              { label: "Contact", value: formatPhone(student.contact) },
              { label: "Email", value: student.email },
              { label: "Source", value: student.source },
              { label: "Status", value: admission.status },
              {
                label: "Batch",
                value: batch ? (
                  <Link href={`/courses/${batch.courseId}`} className="underline-offset-4 hover:underline">
                    {batch.name}
                  </Link>
                ) : (
                  admission.batch
                ),
              },
              { label: "Joined", value: formatDate(admission.joinedOn) },
              ...(admission.status === "Discontinued"
                ? [
                    { label: "Left on", value: formatDate(admission.discontinuedOn) },
                    { label: "Reason", value: admission.discontinueReason },
                  ]
                : []),
              {
                label: "Referral bonus",
                value: admission.referralBonus
                  ? `${formatInr(admission.referralBonus)} · ${admission.referrerName}`
                  : "None",
              },
              {
                label: "Placement",
                value: placement ? (
                  <Link href={`/placements/${placement.id}`} className="underline-offset-4 hover:underline">
                    {placement.id}
                  </Link>
                ) : (
                  "Not on the testing placement list"
                ),
              },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Referral bonus is kept on the admission and is not deducted from the course fee.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Instalments</CardTitle>
          <CardDescription>There is no fixed limit. Four is usual.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {admission.instalments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No instalments yet.</p>
          ) : (
            [...admission.instalments]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="block font-medium">{formatDate(entry.date)}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.mode} · {entry.receivedBy}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge value={entry.kind} />
                    <span className="tabular-nums">{formatInr(entry.amount)}</span>
                  </span>
                </div>
              ))
          )}
        </CardContent>
      </Card>
      {fees ? (
        <Card id="fees">
          <CardHeader>
            <CardTitle>Record a payment or refund</CardTitle>
            <CardDescription>
              Corrections stay in the list and in the audit trail. There is no payment gateway.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LedgerForm
              key={`${paid}-${balance}`}
              balance={balance}
              paid={paid}
              onSubmit={(values) => {
                const result = data.recordAdmissionPayment(admission.id, values, data.user!.name);
                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }
                toast.success(values.kind === "refund" ? "Refund recorded" : "Payment recorded");
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Finance records instalments. This role can review the balance.
        </p>
      )}
    </div>
  );
}
