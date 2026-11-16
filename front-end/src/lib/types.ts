export const ROLES = [
  "Administrator",
  "Admissions",
  "Finance",
  "Placement",
  "Management",
] as const;
export type Role = (typeof ROLES)[number];

export const COURSES = [
  "Software Testing",
  "Full Stack Development",
  "Data Analytics",
  "Python Programming",
  "DevOps",
] as const;
export type Course = (typeof COURSES)[number];

export const SOURCES = [
  "Walk-in",
  "Website",
  "Referral",
  "Instagram",
  "Google",
  "WhatsApp",
] as const;
export type Source = (typeof SOURCES)[number];

export const ENQUIRY_STATUSES = [
  "New",
  "Contacted",
  "Follow-up",
  "Interested",
  "Joined",
  "Not interested",
  "Closed",
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const PAYMENT_MODES = ["Cash", "UPI", "Bank transfer", "Card"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PLACEMENT_STATUSES = [
  "Eligible",
  "In process",
  "Offered",
  "Joined company",
  "On hold",
] as const;
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export const MOCK_RANKS = ["P1", "P2", "P3", "P4", "Unranked"] as const;
export type MockRank = (typeof MOCK_RANKS)[number];

export const CONSULTANCY_STATUSES = [
  "Sourced",
  "Screening",
  "Interview",
  "Offered",
  "Placed",
  "Dropped",
] as const;
export type ConsultancyStatus = (typeof CONSULTANCY_STATUSES)[number];

export const BATCHES = [
  "ST-Sep-2026",
  "ST-Nov-2026",
  "FS-Oct-2026",
  "DA-Nov-2026",
  "PY-Jan-2027",
] as const;

export type ModuleKey =
  | "dashboard"
  | "enquiries"
  | "admissions"
  | "expenses"
  | "placements"
  | "consultancy"
  | "reports"
  | "staff"
  | "audit";

export type AccessLevel = "none" | "read" | "write";

export interface Enquiry {
  id: string;
  enquiryDate: string;
  studentName: string;
  contact: string;
  email: string;
  groupAdded: boolean;
  source: Source;
  course: Course;
  status: EnquiryStatus;
  remarks: string;
  followUpDate: string;
  nextActionDate: string;
  nextAction: string;
}

export interface LedgerEntry {
  id: string;
  kind: "payment" | "refund";
  amount: number;
  date: string;
  mode: PaymentMode;
  receivedBy: string;
  note: string;
}

export interface Admission {
  id: string;
  enquiryId: string;
  batch: string;
  source: Source;
  referralBonus: number;
  referrerName: string;
  agreedFee: number;
  joinedOn: string;
  instalments: LedgerEntry[];
}

export interface Expense {
  id: string;
  date: string;
  purpose: string;
  amount: number;
  debitedBy: string;
}

export interface InternalPlacement {
  id: string;
  admissionId: string;
  mockRank: MockRank;
  company: string;
  salary: string;
  status: PlacementStatus;
  updatedOn: string;
  notes: string;
}

export interface ConsultancyCandidate {
  id: string;
  name: string;
  contact: string;
  email: string;
  progress: ConsultancyStatus;
  company: string;
  salary: string;
  agreedFee: number;
  addedOn: string;
  notes: string;
  collections: LedgerEntry[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  password: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  module: string;
  action: string;
  detail: string;
}

export interface AcademyData {
  enquiries: Enquiry[];
  admissions: Admission[];
  expenses: Expense[];
  placements: InternalPlacement[];
  consultancy: ConsultancyCandidate[];
  staff: StaffUser[];
  audit: AuditEvent[];
}
