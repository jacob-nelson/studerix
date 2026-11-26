import { z } from "zod";

import { isoDate } from "@/lib/dates";

import {
  CONSULTANCY_STATUSES,
  ENQUIRY_STATUSES,
  MOCK_RANKS,
  PAYMENT_MODES,
  PLACEMENT_STATUSES,
  ROLES,
  ATTENDANCE_MARKS,
  BLOOD_GROUPS,
  GENDERS,
  SOURCES,
  STAFF_KINDS,
} from "@/lib/types";

const mobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number");

const optionalMobile = z
  .string()
  .trim()
  .refine((value) => value === "" || /^[6-9]\d{9}$/.test(value), "Enter a 10-digit mobile number");

const photo = z
  .string()
  .min(1, "Add a photo")
  .refine((value) => value.startsWith("data:image/") && value.length < 2_000_000, "Use a photo under 1.5 MB");

export const studentProfileSchema = z.object({
  photo,
  dateOfBirth: z
    .string()
    .min(1, "Enter the date of birth")
    .refine((value) => value <= isoDate(new Date()), "Date of birth cannot be in the future"),
  gender: z.enum(GENDERS, "Choose a gender"),
  bloodGroup: z.enum(BLOOD_GROUPS, "Choose a blood group"),
  qualification: z.string().trim().min(2, "Enter the highest qualification"),
  address: z.string().trim().min(5, "Enter the address"),
  parentName: z.string().trim().min(2, "Enter the parent or guardian name"),
  parentRelation: z.string().trim().min(2, "Enter how they are related"),
  parentContact: mobile,
  emergencyName: z.string().trim().min(2, "Enter the emergency contact name"),
  emergencyRelation: z.string().trim().min(2, "Enter how they are related"),
  emergencyContact: mobile,
  otherContactName: z.string().trim(),
  otherContact: optionalMobile,
  otherContactNote: z.string().trim().max(160, "Keep the note within 160 characters"),
});

export const attendanceSchema = z.object({
  date: z.string().min(1, "Enter the date"),
  batchId: z.string().min(1, "Choose a batch"),
  status: z.enum(ATTENDANCE_MARKS, "Choose present, absent, or late"),
  note: z.string().trim().max(160, "Keep the note within 160 characters"),
});

export const testSchema = z
  .object({
    title: z.string().trim().min(2, "Enter the test name").max(80, "Keep the name within 80 characters"),
    conductedOn: z.string().min(1, "Enter the date"),
    staffId: z.string().min(1, "Choose who conducted the test"),
    maxMarks: z
      .number({ error: "Enter the maximum mark" })
      .int("Use a whole number")
      .positive("Enter the maximum mark")
      .max(1000, "Keep the maximum within 1000"),
    results: z
      .array(
        z.object({
          admissionId: z.string().min(1),
          marks: z.number({ error: "Enter the mark" }).int("Use a whole number").nonnegative("Enter the mark"),
          remarks: z.string().trim().max(160, "Keep the remark within 160 characters"),
        }),
      )
      .min(1, "Add students to this batch before recording a test"),
  })
  .superRefine((value, ctx) => {
    value.results.forEach((result, index) => {
      if (result.marks > value.maxMarks) {
        ctx.addIssue({
          code: "custom",
          path: ["results", index, "marks"],
          message: "Mark is higher than the maximum",
        });
      }
    });
  });

function rupee(message: string, allowZero = false) {
  const amount = z.number({ error: message });
  return allowZero ? amount.nonnegative(message) : amount.positive(message);
}

export const signInSchema = z.object({
  email: z.email("Enter the staff email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter the staff email"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string().min(8, "Confirm the new password"),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export const enquirySchema = z.object({
  enquiryDate: z.string().min(1, "Enter the enquiry date"),
  studentName: z.string().trim().min(2, "Enter the student name"),
  contact: mobile,
  email: z.email("Enter a valid email"),
  groupAdded: z.boolean(),
  source: z.enum(SOURCES, "Choose a source"),
  course: z.string().min(1, "Choose a course"),
  status: z.enum(ENQUIRY_STATUSES, "Choose a status"),
  remarks: z.string().trim().max(500, "Keep remarks within 500 characters"),
  followUpDate: z.string(),
  nextActionDate: z.string(),
  nextAction: z.string().trim().max(160, "Keep the next action within 160 characters"),
});

export const followUpSchema = enquirySchema.pick({
  groupAdded: true,
  remarks: true,
  followUpDate: true,
  nextActionDate: true,
  nextAction: true,
});

export const joinSchema = z
  .object({
    joinedOn: z.string().min(1, "Enter the joining date"),
    batch: z.string().min(1, "Choose a batch"),
    feePlanId: z.string(),
    agreedFee: rupee("Enter the agreed course fee"),
    referralBonus: rupee("Referral bonus cannot be negative", true),
    referrerName: z.string().trim(),
  })
  .refine((value) => value.referralBonus === 0 || value.referrerName.length > 1, {
    path: ["referrerName"],
    message: "Name the referrer when a bonus is recorded",
  });

export function ledgerSchema(balance: number, paid: number) {
  return z
    .object({
      kind: z.enum(["payment", "refund"]),
      amount: rupee("Enter an amount"),
      date: z.string().min(1, "Enter the date"),
      mode: z.enum(PAYMENT_MODES, "Choose how it was received"),
      note: z.string().trim().max(200, "Keep the note within 200 characters"),
    })
    .superRefine((value, ctx) => {
      if (value.kind === "payment" && value.amount > balance) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Amount is higher than the balance",
        });
      }
      if (value.kind === "refund" && value.amount > paid) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Refund is higher than the amount collected",
        });
      }
    });
}

const billFile = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  dataUrl: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("data:") && value.length < 2_000_000, "Each bill must be under 1.5 MB"),
});

export const expenseSchema = z.object({
  date: z.string().min(1, "Enter the expense date"),
  purpose: z.string().trim().min(2, "Enter the purpose"),
  amount: rupee("Enter the amount"),
  debitedBy: z.string().min(1, "Choose who debited this"),
  invoiceNumber: z.string().trim().max(40, "Keep the invoice number within 40 characters"),
  notes: z.string().trim().max(500, "Keep the notes within 500 characters"),
  bills: z.array(billFile).max(5, "Attach up to 5 bills"),
});

export const placementSchema = z.object({
  mockRank: z.enum(MOCK_RANKS, "Choose a mock rank"),
  company: z.string().trim().max(80),
  salary: z.string().trim().max(40),
  status: z.enum(PLACEMENT_STATUSES, "Choose a status"),
  updatedOn: z.string().min(1, "Enter the update date"),
  notes: z.string().trim().max(400),
});

export const consultancySchema = z.object({
  name: z.string().trim().min(2, "Enter the candidate name"),
  contact: mobile,
  email: z.email("Enter a valid email"),
  progress: z.enum(CONSULTANCY_STATUSES, "Choose the progress"),
  company: z.string().trim().max(80),
  salary: z.string().trim().max(40),
  agreedFee: rupee("Fee cannot be negative", true),
  addedOn: z.string().min(1, "Enter the date added"),
  notes: z.string().trim().max(400),
});

export const staffAttendanceSchema = z.object({
  date: z.string().min(1, "Enter the date"),
  status: z.enum(ATTENDANCE_MARKS, "Choose present, absent, or late"),
  note: z.string().trim().max(160, "Keep the note within 160 characters"),
});

export const staffSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the staff name"),
    email: z.email("Enter a valid email"),
    contact: mobile,
    photo,
    gender: z.enum(GENDERS, "Choose a gender"),
    bloodGroup: z.enum(BLOOD_GROUPS, "Choose a blood group"),
    address: z.string().trim().min(5, "Enter the address"),
    qualifications: z
      .array(z.object({ title: z.string().trim().min(2, "Enter the qualification") }))
      .min(1, "Add a qualification")
      .max(8, "Keep qualifications to eight"),
    joinedOn: z.string().min(1, "Enter the joining date"),
    relievedOn: z.string(),
    kind: z.enum(STAFF_KINDS, "Choose teaching or non-teaching"),
    role: z.enum(ROLES, "Choose a role"),
    password: z.string().min(8, "Use at least 8 characters"),
    active: z.boolean(),
    attendance: z
      .array(staffAttendanceSchema)
      .max(30, "Keep the first attendance list shorter"),
  })
  .refine((value) => !value.relievedOn || value.relievedOn >= value.joinedOn, {
    path: ["relievedOn"],
    message: "Relieving date cannot be before the joining date",
  })
  .refine((value) => new Set(value.attendance.map((entry) => entry.date)).size === value.attendance.length, {
    path: ["attendance"],
    message: "Each attendance date can be marked only once",
  });

const weeks = z.number({ error: "Enter the duration in weeks" }).int().positive("Enter the duration in weeks");

export const courseSchema = z.object({
  name: z.string().trim().min(2, "Enter the course name"),
  durationWeeks: weeks,
  fee: rupee("Enter the course fee"),
  summary: z.string().trim().max(300, "Keep the summary within 300 characters"),
  opensPlacement: z.boolean(),
});

export const syllabusSchema = z.object({
  title: z.string().trim().min(2, "Enter the topic"),
  hours: z.number({ error: "Enter the hours" }).positive("Enter the hours"),
});

const share = z
  .number({ error: "Enter a percentage" })
  .int("Use a whole percentage")
  .min(1, "Enter a percentage")
  .max(100, "A part cannot exceed 100%");

export const feePlanSchema = z
  .object({
    name: z.string().trim().min(2, "Name the plan"),
    parts: z
      .array(
        z.object({
          label: z.string().trim().min(2, "Name this part"),
          percent: share,
          dueOn: z.string().min(1, "Enter the due date"),
        }),
      )
      .min(1, "Add at least one part")
      .max(6, "Keep a plan to six parts"),
  })
  .refine((value) => value.parts.reduce((sum, part) => sum + part.percent, 0) === 100, {
    path: ["name"],
    message: "The parts must add up to 100%",
  });

export const scheduleSchema = z.object({
  date: z.string().min(1, "Enter the date"),
  start: z.string().trim().min(4, "Enter the start time"),
  end: z.string().trim().min(4, "Enter the end time"),
  topic: z.string().trim().min(2, "Enter what is taught"),
});

export const batchSchema = z.object({
  name: z.string().trim().min(2, "Enter the batch name"),
  startsOn: z.string().min(1, "Enter the start date"),
  endsOn: z.string().min(1, "Enter the end date"),
});

export const directAdmissionSchema = z
  .object({
    studentName: z.string().trim().min(2, "Enter the student name"),
    contact: mobile,
    email: z.email("Enter a valid email"),
    source: z.enum(SOURCES, "Choose a source"),
    courseId: z.string().min(1, "Choose a course"),
    batchIds: z.array(z.string()).min(1, "Choose at least one batch"),
    photo,
    dateOfBirth: z
      .string()
      .min(1, "Enter the date of birth")
      .refine((value) => value <= isoDate(new Date()), "Date of birth cannot be in the future"),
    gender: z.enum(GENDERS, "Choose a gender"),
    bloodGroup: z.enum(BLOOD_GROUPS, "Choose a blood group"),
    qualification: z.string().trim().min(2, "Enter the highest qualification"),
    address: z.string().trim().min(5, "Enter the address"),
    parentName: z.string().trim().min(2, "Enter the parent or guardian name"),
    parentRelation: z.string().trim().min(2, "Enter how they are related"),
    parentContact: mobile,
    emergencyName: z.string().trim().min(2, "Enter the emergency contact name"),
    emergencyRelation: z.string().trim().min(2, "Enter how they are related"),
    emergencyContact: mobile,
    otherContactName: z.string().trim(),
    otherContact: optionalMobile,
    otherContactNote: z.string().trim().max(160, "Keep the note within 160 characters"),
    feePlanId: z.string(),
    joinedOn: z.string().min(1, "Enter the joining date"),
    agreedFee: rupee("Enter the agreed course fee"),
    referralBonus: rupee("Referral bonus cannot be negative", true),
    referrerName: z.string().trim(),
  })
  .refine((value) => value.referralBonus === 0 || value.referrerName.length > 1, {
    path: ["referrerName"],
    message: "Name the referrer when a bonus is recorded",
  });

export const discontinueSchema = z.object({
  discontinuedOn: z.string().min(1, "Enter the date"),
  discontinueReason: z.string().trim().min(3, "Enter why the student is leaving"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;
export type JoinInput = z.infer<typeof joinSchema>;
export type LedgerInput = z.infer<ReturnType<typeof ledgerSchema>>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type PlacementInput = z.infer<typeof placementSchema>;
export type ConsultancyInput = z.infer<typeof consultancySchema>;
export type StaffInput = z.infer<typeof staffSchema>;
export type StaffAttendanceInput = z.infer<typeof staffAttendanceSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type SyllabusInput = z.infer<typeof syllabusSchema>;
export type FeePlanInput = z.infer<typeof feePlanSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type DirectAdmissionInput = z.infer<typeof directAdmissionSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type TestInput = z.infer<typeof testSchema>;
export type DiscontinueInput = z.infer<typeof discontinueSchema>;
