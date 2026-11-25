"use client";

import { toast } from "sonner";

import { Facts } from "@/components/facts";
import { LedgerForm } from "@/components/forms/ledger-form";
import { PageHeader } from "@/components/page-header";
import { CandidateForm } from "@/components/screens/candidate-form";
import { AccessDenied, MissingRecord } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatInr, formatPhone } from "@/lib/format";
import { accessLevel, canRecordFees } from "@/lib/permissions";
import { balanceAmount, paidAmount } from "@/lib/records";
import { useAcademy } from "@/lib/store";

export function ConsultancyDetailScreen({ id }: { id: string }) {
  const data = useAcademy();
  const candidate = data.consultancy.find((item) => item.id === id);
  const level = data.user ? accessLevel(data.user.role, "consultancy", data.permissions) : "none";

  if (level === "none") return <AccessDenied />;
  if (!candidate || !data.user) return <MissingRecord href="/consultancy" label="Back to consultancy" />;

  const paid = paidAmount(candidate.collections);
  const balance = balanceAmount(candidate.agreedFee, candidate.collections);
  const fees = canRecordFees(data.user.role, data.permissions);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        eyebrow={candidate.id}
        title={candidate.name}
        description="External candidate. Not linked to a course admission."
        actions={<StatusBadge value={candidate.progress} />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Fee position</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Contact", value: formatPhone(candidate.contact) },
              { label: "Email", value: candidate.email },
              { label: "Agreed fee", value: formatInr(candidate.agreedFee) },
              { label: "Collected", value: formatInr(paid) },
              { label: "Balance", value: formatInr(balance) },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {candidate.collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee collected yet.</p>
          ) : (
            candidate.collections.map((entry) => (
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
        <Card>
          <CardHeader>
            <CardTitle>Record consultancy fee</CardTitle>
            <CardDescription>Entered by finance. There is no online payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <LedgerForm
              key={`${paid}-${balance}`}
              balance={balance}
              paid={paid}
              onSubmit={(values) => {
                const result = data.recordConsultancyPayment(candidate.id, values, data.user!.name);
                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }
                toast.success(values.kind === "refund" ? "Refund recorded" : "Fee recorded");
              }}
            />
          </CardContent>
        </Card>
      ) : null}
      {level === "write" ? (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <CandidateForm
              defaultValues={candidate}
              submitLabel="Save progress"
              onSubmit={(values) => {
                data.updateCandidate(candidate, values, data.user!.name);
                toast.success("Candidate updated");
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
