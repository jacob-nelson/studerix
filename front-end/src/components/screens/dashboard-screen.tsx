"use client";

import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { PeriodFilter } from "@/components/period-filter";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { inPeriod, isoDate, periodBounds, type Period } from "@/lib/dates";
import { formatDate, formatInr } from "@/lib/format";
import { balanceAmount, isOpenEnquiry, paymentRows } from "@/lib/records";
import { useAcademy } from "@/lib/store";

export function DashboardScreen() {
  const data = useAcademy();
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const bounds = periodBounds(period, from, to);
  const today = isoDate(new Date());

  const joined = data.admissions.filter((item) => inPeriod(item.joinedOn, bounds.from, bounds.to));
  const internal = data.placements.filter((item) => inPeriod(item.updatedOn, bounds.from, bounds.to));
  const consultancy = data.consultancy.filter((item) => inPeriod(item.addedOn, bounds.from, bounds.to));
  const payments = paymentRows(data).filter((item) => inPeriod(item.date, bounds.from, bounds.to));
  const received = payments.reduce((sum, item) => sum + item.signedAmount, 0);
  const expenseTotal = data.expenses
    .filter((item) => inPeriod(item.date, bounds.from, bounds.to))
    .reduce((sum, item) => sum + item.amount, 0);
  const outstanding = data.admissions.reduce(
    (sum, item) => sum + balanceAmount(item.agreedFee, item.instalments),
    0,
  );
  const openEnquiries = data.enquiries.filter((item) => isOpenEnquiry(item.status));
  const due = data.enquiries
    .filter((item) => isOpenEnquiry(item.status) && item.followUpDate && item.followUpDate <= today)
    .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

  const cards = [
    {
      href: "/admissions",
      label: "Admissions",
      value: String(joined.length),
      hint: "Joined in this period",
    },
    {
      href: "/placements",
      label: "Internal placements",
      value: String(internal.length),
      hint: "Testing students updated in this period",
    },
    {
      href: "/consultancy",
      label: "Consultancy",
      value: String(consultancy.length),
      hint: "External candidates added in this period",
    },
    {
      href: "/reports",
      label: "Payments received",
      value: formatInr(received),
      hint: "Course fees and consultancy fees",
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <PageHeader
        eyebrow="Overview"
        title={`Hello, ${data.user?.name.split(" ")[0]}`}
        description="Admissions use the joining date. Placements use the last update. Payments use the date the money was received."
      />
      <PeriodFilter
        period={period}
        from={from}
        to={to}
        onPeriod={setPeriod}
        onFrom={setFrom}
        onTo={setTo}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <Card className="h-full transition hover:ring-foreground/20">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="font-heading text-3xl tabular-nums">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{card.hint}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Open enquiries</CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">{openEnquiries.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Not yet joined, closed, or declined</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Fee balance</CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">{formatInr(outstanding)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Agreed course fees still to collect</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Expenses</CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">{formatInr(expenseTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Recorded in this period</CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups due</CardTitle>
            <CardDescription>Open enquiries with a follow-up date of today or earlier</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {due.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing is due.</p>
            ) : (
              due.map((enquiry) => (
                <Link
                  key={enquiry.id}
                  href={`/enquiries/${enquiry.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
                >
                  <span>
                    <span className="block text-sm font-medium">{enquiry.studentName}</span>
                    <span className="text-xs text-muted-foreground">
                      {enquiry.course} · {formatDate(enquiry.followUpDate)}
                    </span>
                  </span>
                  <StatusBadge value={enquiry.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payments in this period</CardTitle>
            <CardDescription>Newest first. Refunds reduce the total.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments in this period.</p>
            ) : (
              payments.slice(0, 6).map((payment) => (
                <Link
                  key={payment.id}
                  href={payment.href}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
                >
                  <span>
                    <span className="block text-sm font-medium">{payment.person}</span>
                    <span className="text-xs text-muted-foreground">
                      {payment.context} · {formatDate(payment.date)}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">
                    {formatInr(payment.signedAmount)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
