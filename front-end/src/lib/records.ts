import type {
  AcademyData,
  Admission,
  EnquiryStatus,
  FeePart,
  LedgerEntry,
} from "@/lib/types";

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

export function nextId(prefix: string, ids: string[]) {
  const max = ids.reduce((highest, id) => {
    const value = Number(id.slice(prefix.length + 1));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export interface StudentView {
  name: string;
  contact: string;
  email: string;
  course: string;
  source: string;
}

export function studentForAdmission(data: AcademyData, admission: Admission): StudentView {
  const enquiry = data.enquiries.find((item) => item.id === admission.enquiryId);
  return {
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
        href: `/admissions/${admission.id}`,
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
