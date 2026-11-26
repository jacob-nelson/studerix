export const ROLES = [
  "Administrator",
  "Admissions",
  "Finance",
  "Placement",
  "Management",
  "Faculty",
] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_KINDS = ["Teaching", "Non-teaching"] as const;
export type StaffKind = (typeof STAFF_KINDS)[number];

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

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const ADMISSION_STATUSES = ["Active", "Completed", "Discontinued"] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export const ATTENDANCE_MARKS = ["Present", "Absent", "Late"] as const;
export type AttendanceMark = (typeof ATTENDANCE_MARKS)[number];

export const GENDERS = ["Female", "Male", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export interface StudentProfile {
  photo: string;
  dateOfBirth: string;
  gender: Gender | "";
  bloodGroup: BloodGroup | "";
  qualification: string;
  address: string;
  parentName: string;
  parentRelation: string;
  parentContact: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyContact: string;
  otherContactName: string;
  otherContact: string;
  otherContactNote: string;
}

export interface AttendanceEntry {
  id: string;
  date: string;
  batchId: string;
  status: AttendanceMark;
  note: string;
}

export type ModuleKey =
  | "dashboard"
  | "enquiries"
  | "courses"
  | "admissions"
  | "expenses"
  | "placements"
  | "consultancy"
  | "reports"
  | "staff"
  | "audit";

export type AccessLevel = "none" | "read" | "write";

export interface Enquiry extends StudentProfile {
  id: string;
  enquiryDate: string;
  studentName: string;
  contact: string;
  email: string;
  groupAdded: boolean;
  source: Source;
  course: string;
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

export interface SyllabusTopic {
  id: string;
  title: string;
  hours: number;
}

export interface FeePart {
  label: string;
  percent: number;
}

export interface FeePlan {
  id: string;
  name: string;
  parts: FeePart[];
}

export interface ClassSlot {
  id: string;
  day: Weekday;
  start: string;
  end: string;
  topic: string;
}

export interface CourseOffering {
  id: string;
  name: string;
  durationWeeks: number;
  fee: number;
  summary: string;
  opensPlacement: boolean;
  syllabus: SyllabusTopic[];
  feePlans: FeePlan[];
}

export interface Batch {
  id: string;
  courseId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  schedule: ClassSlot[];
  staffIds: string[];
}

export interface Admission {
  id: string;
  enquiryId: string;
  batch: string;
  batchId: string;
  batchIds: string[];
  status: AdmissionStatus;
  discontinuedOn: string;
  discontinueReason: string;
  source: Source;
  referralBonus: number;
  referrerName: string;
  agreedFee: number;
  joinedOn: string;
  feePlanName: string;
  feeSchedule: FeePart[];
  instalments: LedgerEntry[];
  attendance: AttendanceEntry[];
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
  kind: StaffKind;
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
  permissions: Record<Role, Record<ModuleKey, AccessLevel>>;
  exportRoles: Role[];
  courses: CourseOffering[];
  batches: Batch[];
  enquiries: Enquiry[];
  admissions: Admission[];
  expenses: Expense[];
  placements: InternalPlacement[];
  consultancy: ConsultancyCandidate[];
  staff: StaffUser[];
  audit: AuditEvent[];
}
