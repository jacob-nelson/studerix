import { daysUntil, isoDate } from "@/lib/dates";
import type {
  AcademyData,
  Admission,
  EnquiryStatus,
  FeePart,
  LedgerEntry,
  SalaryRevision,
  StaffAttendance,
  StudentProfile,
} from "@/lib/types";

export const DUE_SOON_DAYS = 7;

export function currentRevision(revisions: SalaryRevision[], asOf = isoDate(new Date())) {
  return (
    revisions
      .filter((item) => item.effectiveOn <= asOf)
      .sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn) || b.id.localeCompare(a.id))[0] ?? null
  );
}

export function nextRevision(revisions: SalaryRevision[], asOf = isoDate(new Date())) {
  return (
    revisions
      .filter((item) => item.effectiveOn > asOf)
      .sort((a, b) => a.effectiveOn.localeCompare(b.effectiveOn))[0] ?? null
  );
}

export function attendanceTally(entries: StaffAttendance[]) {
  const present = entries.filter((item) => item.status === "Present").length;
  const late = entries.filter((item) => item.status === "Late").length;
  const absent = entries.filter((item) => item.status === "Absent").length;
  const marked = present + late + absent;
  const rate = marked === 0 ? null : Math.round(((present + late) / marked) * 100);
  return { present, late, absent, marked, rate };
}

export function testStanding(conductedOn: string, now = new Date()) {
  const days = daysUntil(conductedOn, now);
  return days !== null && days > 0 ? "Upcoming" : "Conducted";
}

export type InstalmentTiming = "paid" | "overdue" | "due-soon" | "scheduled";

export function blankProfile(): StudentProfile {
  return {
    photo: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    qualification: "",
    address: "",
    parentName: "",
    parentRelation: "",
    parentContact: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyContact: "",
    otherContactName: "",
    otherContact: "",
    otherContactNote: "",
  };
}

export function onBatch(admission: Admission, batchId: string) {
  return admission.batchIds.includes(batchId) || admission.batchId === batchId;
}

export function isOpenEnquiry(status: EnquiryStatus) {
  return status !== "Joined" && status !== "Not interested" && status !== "Closed";
}

export function paidAmount(entries: LedgerEntry[]) {
  return entries.reduce(
    (sum, entry) => sum + (entry.kind === "payment" ? entry.amount : -entry.amount),
    0,
  );
}

export function balanceAmount(agreedFee: number, entries: LedgerEntry[]) {
  return agreedFee - paidAmount(entries);
}

export function scheduleAmounts(fee: number, parts: FeePart[]) {
  let used = 0;
  return parts.map((part, index) => {
    const amount = index === parts.length - 1 ? fee - used : Math.round((fee * part.percent) / 100);
    used += amount;
    return { ...part, amount };
  });
}

export function instalmentTimings<T extends FeePart & { amount: number }>(
  parts: T[],
  paid: number,
  now = new Date(),
) {
  const order = parts
    .map((part, index) => ({ part, index }))
    .sort(
      (a, b) =>
        (a.part.dueOn || "9999-12-31").localeCompare(b.part.dueOn || "9999-12-31") || a.index - b.index,
    );
  const timings: Array<T & { outstanding: number; days: number | null; timing: InstalmentTiming }> = [];
  let remaining = Math.max(0, paid);
  for (const { part, index } of order) {
    const covered = Math.min(part.amount, remaining);
    remaining -= covered;
    const outstanding = part.amount - covered;
    const days = part.dueOn ? daysUntil(part.dueOn, now) : null;
    let timing: InstalmentTiming = "scheduled";
    if (outstanding <= 0) timing = "paid";
    else if (days !== null && days < 0) timing = "overdue";
    else if (days !== null && days <= DUE_SOON_DAYS) timing = "due-soon";
    timings[index] = { ...part, outstanding, days, timing };
  }
  return timings;
}

export function nextId(prefix: string, ids: string[]) {
  const max = ids.reduce((highest, id) => {
    const value = Number(id.slice(prefix.length + 1));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export interface StudentView extends StudentProfile {
  name: string;
  contact: string;
  email: string;
  course: string;
  source: string;
}

export function studentForAdmission(data: AcademyData, admission: Admission): StudentView {
  const enquiry = data.enquiries.find((item) => item.id === admission.enquiryId);
  return {
    ...blankProfile(),
    ...enquiry,
    name: enquiry?.studentName ?? "Unknown student",
    contact: enquiry?.contact ?? "",
    email: enquiry?.email ?? "",
    course: enquiry?.course ?? "",
    source: enquiry?.source ?? admission.source,
  };
}

export interface PaymentRow {
  id: string;
  date: string;
  person: string;
  context: "Course fee" | "Consultancy fee";
  kind: LedgerEntry["kind"];
  mode: string;
  signedAmount: number;
  receivedBy: string;
  note: string;
  href: string;
}

export function paymentRows(data: AcademyData): PaymentRow[] {
  const rows: PaymentRow[] = [];
  for (const admission of data.admissions) {
    const student = studentForAdmission(data, admission);
    for (const entry of admission.instalments) {
      rows.push({
        id: entry.id,
        date: entry.date,
        person: student.name,
        context: "Course fee",
        kind: entry.kind,
        mode: entry.mode,
        signedAmount: entry.kind === "payment" ? entry.amount : -entry.amount,
        receivedBy: entry.receivedBy,
        note: entry.note,
        href: `/admissions/${admission.id}/fees`,
      });
    }
  }
  for (const candidate of data.consultancy) {
    for (const entry of candidate.collections) {
      rows.push({
        id: entry.id,
        date: entry.date,
        person: candidate.name,
        context: "Consultancy fee",
        kind: entry.kind,
        mode: entry.mode,
        signedAmount: entry.kind === "payment" ? entry.amount : -entry.amount,
        receivedBy: entry.receivedBy,
        note: entry.note,
        href: `/consultancy/${candidate.id}`,
      });
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function paymentIds(data: AcademyData) {
  return [
    ...data.admissions.flatMap((admission) => admission.instalments.map((entry) => entry.id)),
    ...data.consultancy.flatMap((candidate) => candidate.collections.map((entry) => entry.id)),
  ];
}
