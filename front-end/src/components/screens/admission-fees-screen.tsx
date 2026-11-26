"use client";

import { toast } from "sonner";

import { LedgerForm } from "@/components/forms/ledger-form";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatInr } from "@/lib/format";
import { canRecordFees } from "@/lib/permissions";
import { balanceAmount, instalmentTimings, paidAmount, scheduleAmounts, type InstalmentTiming } from "@/lib/records";
import { useAcademy } from "@/lib/store";

function timingLabel(timing: InstalmentTiming, days: number | null) {
  if (timing === "paid") return "Paid";
  if (timing === "overdue") return "Overdue";
  if (timing === "due-soon") {
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return "Due soon";
  }
  return "";
}

function timingNote(part: { label: string; outstanding: number; days: number | null; timing: InstalmentTiming }) {
  if (part.timing === "overdue" && part.days !== null) {
    const late = Math.abs(part.days);
    return `${part.label} is overdue by ${late === 1 ? "1 day" : `${late} days`}. ${formatInr(part.outstanding)} is still unpaid.`;
  }
  if (part.timing === "due-soon" && part.days !== null) {
    const when = part.days === 0 ? "today" : part.days === 1 ? "tomorrow" : `in ${part.days} days`;
    return `${part.label} is due ${when}. ${formatInr(part.outstanding)} is still unpaid.`;
  }
  return "";
}

export function AdmissionFees({ id }: { id: string }) {
  const data = useAcademy();
  const admission = data.admissions.find((item) => item.id === id);
  if (!admission || !data.user) return null;

  const paid = paidAmount(admission.instalments);
  const balance = balanceAmount(admission.agreedFee, admission.instalments);
  const schedule = instalmentTimings(scheduleAmounts(admission.agreedFee, admission.feeSchedule), paid);
  const width = admission.agreedFee > 0 ? Math.min(100, Math.max(0, (paid / admission.agreedFee) * 100)) : 0;
  const fees = canRecordFees(data.user.role, data.permissions);

  return (
    <div className="grid gap-6">
      {fees ? (
        <Card>
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
        <p className="text-sm text-muted-foreground">Finance records instalments. This role can review the balance.</p>
      )}
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
          <p className="text-xs text-muted-foreground">
            Referral bonus
            {admission.referralBonus
              ? ` of ${formatInr(admission.referralBonus)} for ${admission.referrerName} is kept on the admission and is not deducted from the course fee.`
              : " is not recorded on this admission."}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment schedule</CardTitle>
          <CardDescription>{admission.feePlanName || "No plan was chosen for this admission."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {admission.feeSchedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Fee plans are defined on the course. Choose one when the student is admitted.
            </p>
          ) : (
            <>
              {schedule
                .filter((part) => part.timing === "overdue" || part.timing === "due-soon")
                .sort((a, b) => (a.timing === b.timing ? (a.days ?? 0) - (b.days ?? 0) : a.timing === "overdue" ? -1 : 1))
                .map((part) => (
                  <p
                    key={`${part.label}-${part.timing}`}
                    className={
                      part.timing === "overdue"
                        ? "rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-900"
                        : "rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-950"
                    }
                  >
                    {timingNote(part)}
                  </p>
                ))}
              <ul className="grid gap-2">
                {schedule.map((part) => {
                  const label = timingLabel(part.timing, part.days);
                  return (
                    <li key={`${part.label}-${part.percent}`} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {part.label}
                        <span className="ml-2 text-muted-foreground">{part.percent}%</span>
                        {part.dueOn ? <span className="ml-2 text-muted-foreground">Due {formatDate(part.dueOn)}</span> : null}
                      </span>
                      <span className="flex items-center gap-2">
                        {label ? <StatusBadge value={label} /> : null}
                        <span className="tabular-nums">{formatInr(part.amount)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
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
    </div>
  );
}
