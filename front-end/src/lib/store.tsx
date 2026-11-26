"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { blankProfile, nextId, onBatch, paymentIds } from "@/lib/records";
import type {
  AttendanceInput,
  BatchInput,
  ConsultancyInput,
  CourseInput,
  DirectAdmissionInput,
  DiscontinueInput,
  EnquiryInput,
  ExpenseInput,
  FeePlanInput,
  FollowUpInput,
  JoinInput,
  LedgerInput,
  PlacementInput,
  SalaryRevisionInput,
  SalaryTransferInput,
  ScheduleInput,
  StaffAttendanceInput,
  StaffBankInput,
  StaffInput,
  StudentProfileInput,
  SyllabusInput,
  TestInput,
} from "@/lib/schemas";
import { createSeed } from "@/lib/seed";
import type {
  AcademyData,
  Admission,
  AdmissionStatus,
  AuditEvent,
  Batch,
  BatchTest,
  ClassSlot,
  ConsultancyCandidate,
  CourseOffering,
  Enquiry,
  Expense,
  FeePart,
  FeePlan,
  InternalPlacement,
  AccessLevel,
  LedgerEntry,
  ModuleKey,
  Role,
  SalaryRevision,
  SalaryTransfer,
  StaffAttendance,
  StaffUser,
  SyllabusTopic,
} from "@/lib/types";

const SESSION_KEY = "tm.session";

function feeAgreement(
  course: CourseOffering,
  planId: string,
): { ok: true; feePlanName: string; feeSchedule: FeePart[] } | { ok: false; message: string } {
  if (course.feePlans.length === 0) return { ok: true, feePlanName: "", feeSchedule: [] };
  const plan = course.feePlans.find((item) => item.id === planId);
  if (!plan) return { ok: false, message: "Choose a fee plan for this course." };
  return {
    ok: true,
    feePlanName: plan.name,
    feeSchedule: plan.parts.map((part) => ({ label: part.label, percent: part.percent, dueOn: part.dueOn })),
  };
}

interface AcademyState extends AcademyData {
  sessionUserId: string | null;
}

type Action =
  | { type: "sign-in"; userId: string }
  | { type: "sign-out" }
  | { type: "set-password"; userId: string; password: string; audit: AuditEvent }
  | { type: "add-enquiry"; enquiry: Enquiry; audit: AuditEvent }
  | { type: "update-enquiry"; enquiry: Enquiry; audit: AuditEvent }
  | {
      type: "mark-joined";
      enquiryId: string;
      admission: Admission;
      placement?: InternalPlacement;
      audit: AuditEvent;
    }
  | {
      type: "add-instalment";
      admissionId: string;
      entry: LedgerEntry;
      audit: AuditEvent;
    }
  | { type: "add-expense"; expense: Expense; audit: AuditEvent }
  | { type: "update-placement"; placement: InternalPlacement; audit: AuditEvent }
  | { type: "add-candidate"; candidate: ConsultancyCandidate; audit: AuditEvent }
  | { type: "update-candidate"; candidate: ConsultancyCandidate; audit: AuditEvent }
  | {
      type: "add-collection";
      candidateId: string;
      entry: LedgerEntry;
      audit: AuditEvent;
    }
  | { type: "add-staff"; user: StaffUser; audit: AuditEvent }
  | { type: "update-staff"; user: StaffUser; audit: AuditEvent }
  | { type: "set-staff-active"; userId: string; active: boolean; audit: AuditEvent }
  | { type: "set-permission"; role: Role; module: ModuleKey; level: AccessLevel; audit: AuditEvent }
  | { type: "set-export"; role: Role; allowed: boolean; audit: AuditEvent }
  | {
      type: "save-permissions";
      permissions: Record<Role, Record<ModuleKey, AccessLevel>>;
      exportRoles: Role[];
      audit: AuditEvent;
    }
  | { type: "assign-batch-staff"; batchId: string; staffId: string; audit: AuditEvent }
  | { type: "remove-batch-staff"; batchId: string; staffId: string; audit: AuditEvent }
  | { type: "add-course"; course: CourseOffering; audit: AuditEvent }
  | { type: "update-course"; course: CourseOffering; audit: AuditEvent }
  | { type: "add-syllabus"; courseId: string; topic: SyllabusTopic; audit: AuditEvent }
  | { type: "remove-syllabus"; courseId: string; topicId: string; audit: AuditEvent }
  | { type: "add-slot"; batchId: string; slot: ClassSlot; audit: AuditEvent }
  | { type: "remove-slot"; batchId: string; slotId: string; audit: AuditEvent }
  | { type: "add-fee-plan"; courseId: string; plan: FeePlan; audit: AuditEvent }
  | { type: "remove-fee-plan"; courseId: string; planId: string; audit: AuditEvent }
  | { type: "add-batch"; batch: Batch; audit: AuditEvent }
  | {
      type: "admit-student";
      enquiry: Enquiry;
      admission: Admission;
      placement?: InternalPlacement;
      audit: AuditEvent;
    }
  | { type: "set-admission-status"; admission: Admission; audit: AuditEvent }
  | { type: "assign-batch"; admission: Admission; enquiry?: Enquiry; audit: AuditEvent }
  | { type: "update-admission"; admission: Admission; audit: AuditEvent }
  | { type: "add-test"; test: BatchTest; audit: AuditEvent }
  | { type: "remove-test"; testId: string; audit: AuditEvent };

function reducer(state: AcademyState, action: Action): AcademyState {
  switch (action.type) {
    case "sign-in":
      return { ...state, sessionUserId: action.userId };
    case "sign-out":
      return { ...state, sessionUserId: null };
    case "set-password":
      return {
        ...state,
        staff: state.staff.map((user) =>
          user.id === action.userId ? { ...user, password: action.password } : user,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-enquiry":
      return {
        ...state,
        enquiries: [action.enquiry, ...state.enquiries],
        audit: [action.audit, ...state.audit],
      };
    case "update-enquiry":
      return {
        ...state,
        enquiries: state.enquiries.map((enquiry) =>
          enquiry.id === action.enquiry.id ? action.enquiry : enquiry,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "mark-joined":
      return {
        ...state,
        enquiries: state.enquiries.map((enquiry) =>
          enquiry.id === action.enquiryId
            ? { ...enquiry, status: "Joined", followUpDate: "", nextActionDate: "", nextAction: "" }
            : enquiry,
        ),
        admissions: [action.admission, ...state.admissions],
        placements: action.placement
          ? [action.placement, ...state.placements]
          : state.placements,
        audit: [action.audit, ...state.audit],
      };
    case "add-instalment":
      return {
        ...state,
        admissions: state.admissions.map((admission) =>
          admission.id === action.admissionId
            ? { ...admission, instalments: [...admission.instalments, action.entry] }
            : admission,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-expense":
      return {
        ...state,
        expenses: [action.expense, ...state.expenses],
        audit: [action.audit, ...state.audit],
      };
    case "update-placement":
      return {
        ...state,
        placements: state.placements.map((placement) =>
          placement.id === action.placement.id ? action.placement : placement,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-candidate":
      return {
        ...state,
        consultancy: [action.candidate, ...state.consultancy],
        audit: [action.audit, ...state.audit],
      };
    case "update-candidate":
      return {
        ...state,
        consultancy: state.consultancy.map((candidate) =>
          candidate.id === action.candidate.id ? action.candidate : candidate,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-collection":
      return {
        ...state,
        consultancy: state.consultancy.map((candidate) =>
          candidate.id === action.candidateId
            ? { ...candidate, collections: [...candidate.collections, action.entry] }
            : candidate,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-staff":
      return {
        ...state,
        staff: [...state.staff, action.user],
        audit: [action.audit, ...state.audit],
      };
    case "update-staff":
      return {
        ...state,
        staff: state.staff.map((user) => (user.id === action.user.id ? action.user : user)),
        audit: [action.audit, ...state.audit],
      };
    case "set-staff-active":
      return {
        ...state,
        staff: state.staff.map((user) =>
          user.id === action.userId ? { ...user, active: action.active } : user,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "set-permission":
      return {
        ...state,
        permissions: {
          ...state.permissions,
          [action.role]: { ...state.permissions[action.role], [action.module]: action.level },
        },
        audit: [action.audit, ...state.audit],
      };
    case "set-export":
      return {
        ...state,
        exportRoles: action.allowed
          ? state.exportRoles.includes(action.role)
            ? state.exportRoles
            : [...state.exportRoles, action.role]
          : state.exportRoles.filter((role) => role !== action.role),
        audit: [action.audit, ...state.audit],
      };
    case "save-permissions":
      return {
        ...state,
        permissions: action.permissions,
        exportRoles: action.exportRoles,
        audit: [action.audit, ...state.audit],
      };
    case "assign-batch-staff":
      return {
        ...state,
        batches: state.batches.map((batch) =>
          batch.id === action.batchId
            ? { ...batch, staffIds: [...batch.staffIds, action.staffId] }
            : batch,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "remove-batch-staff":
      return {
        ...state,
        batches: state.batches.map((batch) =>
          batch.id === action.batchId
            ? { ...batch, staffIds: batch.staffIds.filter((id) => id !== action.staffId) }
            : batch,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-course":
      return {
        ...state,
        courses: [...state.courses, action.course],
        audit: [action.audit, ...state.audit],
      };
    case "update-course":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id === action.course.id ? action.course : course,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-syllabus":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id === action.courseId
            ? { ...course, syllabus: [...course.syllabus, action.topic] }
            : course,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "remove-syllabus":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id === action.courseId
            ? { ...course, syllabus: course.syllabus.filter((topic) => topic.id !== action.topicId) }
            : course,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-slot":
      return {
        ...state,
        batches: state.batches.map((batch) =>
          batch.id === action.batchId ? { ...batch, schedule: [...batch.schedule, action.slot] } : batch,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "remove-slot":
      return {
        ...state,
        batches: state.batches.map((batch) =>
          batch.id === action.batchId
            ? { ...batch, schedule: batch.schedule.filter((slot) => slot.id !== action.slotId) }
            : batch,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-fee-plan":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id === action.courseId
            ? { ...course, feePlans: [...course.feePlans, action.plan] }
            : course,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "remove-fee-plan":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id === action.courseId
            ? { ...course, feePlans: course.feePlans.filter((plan) => plan.id !== action.planId) }
            : course,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-batch":
      return {
        ...state,
        batches: [...state.batches, action.batch],
        audit: [action.audit, ...state.audit],
      };
    case "admit-student":
      return {
        ...state,
        enquiries: [action.enquiry, ...state.enquiries],
        admissions: [action.admission, ...state.admissions],
        placements: action.placement
          ? [action.placement, ...state.placements]
          : state.placements,
        audit: [action.audit, ...state.audit],
      };
    case "set-admission-status":
      return {
        ...state,
        admissions: state.admissions.map((admission) =>
          admission.id === action.admission.id ? action.admission : admission,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "assign-batch":
      return {
        ...state,
        admissions: state.admissions.map((admission) =>
          admission.id === action.admission.id ? action.admission : admission,
        ),
        enquiries: action.enquiry
          ? state.enquiries.map((enquiry) =>
              enquiry.id === action.enquiry!.id ? action.enquiry! : enquiry,
            )
          : state.enquiries,
        audit: [action.audit, ...state.audit],
      };
    case "update-admission":
      return {
        ...state,
        admissions: state.admissions.map((admission) =>
          admission.id === action.admission.id ? action.admission : admission,
        ),
        audit: [action.audit, ...state.audit],
      };
    case "add-test":
      return {
        ...state,
        tests: [action.test, ...state.tests],
        audit: [action.audit, ...state.audit],
      };
    case "remove-test":
      return {
        ...state,
        tests: state.tests.filter((test) => test.id !== action.testId),
        audit: [action.audit, ...state.audit],
      };
    default:
      return state;
  }
}

function withBatches(admission: Admission, batchIds: string[], batches: Batch[]): Admission {
  const unique = [...new Set(batchIds)];
  const names = unique
    .map((id) => batches.find((batch) => batch.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  return {
    ...admission,
    batchIds: unique,
    batchId: unique[0] ?? "",
    batch: names.join(", "),
  };
}

function createAudit(
  data: AcademyData,
  actor: string,
  module: string,
  action: string,
  detail: string,
): AuditEvent {
  return {
    id: nextId(
      "AUD",
      data.audit.map((event) => event.id),
    ),
    at: new Date().toISOString(),
    actor,
    module,
    action,
    detail,
  };
}

type Failure = { ok: false; message: string };
type Success<T extends object = object> = { ok: true } & T;

interface AcademyContextValue extends AcademyState {
  ready: boolean;
  user: StaffUser | null;
  signIn: (email: string, password: string) => Success | Failure;
  signOut: () => void;
  resetPassword: (
    email: string,
    password: string,
  ) => Success<{ active: boolean }> | Failure;
  addEnquiry: (input: EnquiryInput, actor: string) => string;
  updateEnquiry: (enquiry: Enquiry, actor: string) => void;
  saveFollowUp: (enquiry: Enquiry, input: FollowUpInput, actor: string) => void;
  markJoined: (
    enquiryId: string,
    input: JoinInput,
    actor: string,
  ) => Success<{ admissionId: string }> | Failure;
  recordAdmissionPayment: (
    admissionId: string,
    input: LedgerInput,
    actor: string,
  ) => Success | Failure;
  addExpense: (input: ExpenseInput, actor: string) => string;
  updatePlacement: (
    placement: InternalPlacement,
    input: PlacementInput,
    actor: string,
  ) => void;
  addCandidate: (input: ConsultancyInput, actor: string) => string;
  updateCandidate: (
    candidate: ConsultancyCandidate,
    input: ConsultancyInput,
    actor: string,
  ) => void;
  recordConsultancyPayment: (
    candidateId: string,
    input: LedgerInput,
    actor: string,
  ) => Success | Failure;
  addStaff: (input: StaffInput, actor: string) => Success<{ id: string; email: string }> | Failure;
  recordStaffAttendance: (staffId: string, input: StaffAttendanceInput, actor: string) => Success | Failure;
  removeStaffAttendance: (staffId: string, entryId: string, actor: string) => Success | Failure;
  updateStaffBank: (staffId: string, input: StaffBankInput, actor: string) => Success | Failure;
  reviseStaffSalary: (staffId: string, input: SalaryRevisionInput, actor: string) => Success | Failure;
  removeSalaryRevision: (staffId: string, revisionId: string, actor: string) => Success | Failure;
  recordSalaryTransfer: (staffId: string, input: SalaryTransferInput, actor: string) => Success | Failure;
  removeSalaryTransfer: (staffId: string, transferId: string, actor: string) => Success | Failure;
  setStaffActive: (
    userId: string,
    active: boolean,
    actor: string,
  ) => Success | Failure;
  setPermission: (role: Role, module: ModuleKey, level: AccessLevel, actor: string) => Success | Failure;
  setExport: (role: Role, allowed: boolean, actor: string) => Success | Failure;
  saveRolePermissions: (
    permissions: Record<Role, Record<ModuleKey, AccessLevel>>,
    exportRoles: Role[],
    actor: string,
  ) => Success | Failure;
  addCourse: (input: CourseInput, actor: string) => Success<{ id: string }> | Failure;
  updateCourse: (course: CourseOffering, input: CourseInput, actor: string) => Success | Failure;
  addSyllabusTopic: (courseId: string, input: SyllabusInput, actor: string) => Success | Failure;
  removeSyllabusTopic: (courseId: string, topicId: string, actor: string) => void;
  addClassSlot: (batchId: string, input: ScheduleInput, actor: string) => Success | Failure;
  removeClassSlot: (batchId: string, slotId: string, actor: string) => void;
  addFeePlan: (courseId: string, input: FeePlanInput, actor: string) => Success | Failure;
  removeFeePlan: (courseId: string, planId: string, actor: string) => void;
  addBatch: (courseId: string, input: BatchInput, actor: string) => Success<{ id: string }> | Failure;
  assignBatchStaff: (batchId: string, staffId: string, actor: string) => Success | Failure;
  removeBatchStaff: (batchId: string, staffId: string, actor: string) => Success | Failure;
  addAdmission: (input: DirectAdmissionInput, actor: string) => Success<{ admissionId: string }> | Failure;
  setAdmissionStatus: (
    admissionId: string,
    status: AdmissionStatus,
    input: DiscontinueInput | null,
    actor: string,
  ) => Success | Failure;
  assignAdmissionBatch: (
    admissionId: string,
    batchId: string,
    actor: string,
  ) => Success | Failure;
  detachAdmissionBatch: (admissionId: string, batchId: string, actor: string) => Success | Failure;
  updateStudentProfile: (enquiryId: string, input: StudentProfileInput, actor: string) => Success | Failure;
  recordAttendance: (admissionId: string, input: AttendanceInput, actor: string) => Success | Failure;
  removeAttendance: (admissionId: string, entryId: string, actor: string) => Success | Failure;
  recordTest: (batchId: string, input: TestInput, actor: string) => Success | Failure;
  removeTest: (testId: string, actor: string) => Success | Failure;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...createSeed(),
    sessionUserId: null,
  }));
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { userId?: string };
        const match = state.staff.find(
          (user) => user.id === parsed.userId && user.active,
        );
        if (match) dispatch({ type: "sign-in", userId: match.id });
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    // localStorage is read after mount so the server render and the first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AcademyContextValue>(() => {
    const user = state.staff.find((item) => item.id === state.sessionUserId && item.active) ?? null;

    return {
      ...state,
      ready,
      user,
      signIn: (email, password) => {
        const match = state.staff.find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!match || match.password !== password) {
          return { ok: false, message: "Email or password does not match a staff login." };
        }
        if (!match.active) {
          return {
            ok: false,
            message: "This staff login has been deactivated. An administrator can restore it.",
          };
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: match.id }));
        dispatch({ type: "sign-in", userId: match.id });
        return { ok: true };
      },
      signOut: () => {
        localStorage.removeItem(SESSION_KEY);
        dispatch({ type: "sign-out" });
      },
      resetPassword: (email, password) => {
        const match = state.staff.find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!match) {
          return { ok: false, message: "That email is not a staff login in this prototype." };
        }
        dispatch({
          type: "set-password",
          userId: match.id,
          password,
          audit: createAudit(
            state,
            match.name,
            "Access",
            "Password reset",
            `Password updated for ${match.email}.`,
          ),
        });
        return { ok: true, active: match.active };
      },
      addEnquiry: (input, actor) => {
        const enquiry: Enquiry = {
          ...blankProfile(),
          ...input,
          id: nextId(
            "ENQ",
            state.enquiries.map((item) => item.id),
          ),
        };
        dispatch({
          type: "add-enquiry",
          enquiry,
          audit: createAudit(
            state,
            actor,
            "Enquiries",
            "Enquiry added",
            `${enquiry.studentName} enquired for ${enquiry.course}.`,
          ),
        });
        return enquiry.id;
      },
      updateEnquiry: (enquiry, actor) => {
        dispatch({
          type: "update-enquiry",
          enquiry,
          audit: createAudit(
            state,
            actor,
            "Enquiries",
            "Enquiry updated",
            `${enquiry.studentName} is now ${enquiry.status}.`,
          ),
        });
      },
      saveFollowUp: (enquiry, input, actor) => {
        const next = { ...enquiry, ...input };
        dispatch({
          type: "update-enquiry",
          enquiry: next,
          audit: createAudit(
            state,
            actor,
            "Enquiries",
            "Follow-up updated",
            `Follow-up notes changed for ${enquiry.studentName}.`,
          ),
        });
      },
      markJoined: (enquiryId, input, actor) => {
        const enquiry = state.enquiries.find((item) => item.id === enquiryId);
        if (!enquiry) return { ok: false, message: "That enquiry is not in this prototype." };
        if (enquiry.status === "Joined") {
          return { ok: false, message: "This enquiry is already marked Joined." };
        }
        const offering = state.courses.find((course) => course.name === enquiry.course);
        const batchRecord = state.batches.find((batch) => batch.name === input.batch);
        if (offering && (!batchRecord || batchRecord.courseId !== offering.id)) {
          return { ok: false, message: "Choose a batch that belongs to this course." };
        }
        const agreement = offering
          ? feeAgreement(offering, input.feePlanId)
          : { ok: true as const, feePlanName: "", feeSchedule: [] as FeePart[] };
        if (!agreement.ok) return agreement;
        const admission: Admission = {
          id: nextId(
            "ADM",
            state.admissions.map((item) => item.id),
          ),
          enquiryId: enquiry.id,
          batch: input.batch,
          batchId: batchRecord?.id ?? "",
          batchIds: batchRecord ? [batchRecord.id] : [],
          status: "Active",
          discontinuedOn: "",
          discontinueReason: "",
          source: enquiry.source,
          referralBonus: input.referralBonus,
          referrerName: input.referrerName,
          agreedFee: input.agreedFee,
          joinedOn: input.joinedOn,
          feePlanName: agreement.feePlanName,
          feeSchedule: agreement.feeSchedule,
          instalments: [],
          attendance: [],
        };
        const opensPlacement = offering
          ? offering.opensPlacement
          : enquiry.course === "Software Testing";
        const placement: InternalPlacement | undefined = opensPlacement
          ? {
                id: nextId(
                  "PLC",
                  state.placements.map((item) => item.id),
                ),
                admissionId: admission.id,
                mockRank: "Unranked",
                company: "",
                salary: "",
                status: "Eligible",
                updatedOn: input.joinedOn,
                notes: "Opened automatically because this student joined a Software Testing course.",
              }
            : undefined;
        dispatch({
          type: "mark-joined",
          enquiryId,
          admission,
          placement,
          audit: createAudit(
            state,
            actor,
            "Enquiries",
            "Marked Joined",
            placement
              ? `${enquiry.studentName} joined ${input.batch}. Internal placement ${placement.id} opened.`
              : `${enquiry.studentName} joined ${input.batch}. ${enquiry.course} stays outside internal placement.`,
          ),
        });
        return { ok: true, admissionId: admission.id };
      },
      recordAdmissionPayment: (admissionId, input, actor) => {
        const admission = state.admissions.find((item) => item.id === admissionId);
        if (!admission) return { ok: false, message: "That admission is not in this prototype." };
        const entry: LedgerEntry = {
          id: nextId("PAY", paymentIds(state)),
          ...input,
          receivedBy: actor,
        };
        const student = state.enquiries.find((item) => item.id === admission.enquiryId);
        dispatch({
          type: "add-instalment",
          admissionId,
          entry,
          audit: createAudit(
            state,
            actor,
            "Admissions",
            input.kind === "refund" ? "Refund recorded" : "Payment recorded",
            `${input.kind === "refund" ? "Refund" : "Payment"} of ₹${input.amount.toLocaleString("en-IN")} for ${student?.studentName ?? "a student"}.`,
          ),
        });
        return { ok: true };
      },
      addExpense: (input, actor) => {
        const expense: Expense = {
          ...input,
          id: nextId(
            "EXP",
            state.expenses.map((item) => item.id),
          ),
        };
        dispatch({
          type: "add-expense",
          expense,
          audit: createAudit(
            state,
            actor,
            "Expenses",
            "Expense added",
            `${expense.purpose}, debited by ${expense.debitedBy}.`,
          ),
        });
        return expense.id;
      },
      updatePlacement: (placement, input, actor) => {
        const next = { ...placement, ...input };
        const admission = state.admissions.find((item) => item.id === placement.admissionId);
        const student = state.enquiries.find((item) => item.id === admission?.enquiryId);
        dispatch({
          type: "update-placement",
          placement: next,
          audit: createAudit(
            state,
            actor,
            "Placements",
            "Placement updated",
            `${student?.studentName ?? "Student"} is ${input.status}${input.company ? ` at ${input.company}` : ""}.`,
          ),
        });
      },
      addCandidate: (input, actor) => {
        const candidate: ConsultancyCandidate = {
          ...input,
          id: nextId(
            "CON",
            state.consultancy.map((item) => item.id),
          ),
          collections: [],
        };
        dispatch({
          type: "add-candidate",
          candidate,
          audit: createAudit(
            state,
            actor,
            "Consultancy",
            "Candidate added",
            `${candidate.name} added without a course admission.`,
          ),
        });
        return candidate.id;
      },
      updateCandidate: (candidate, input, actor) => {
        dispatch({
          type: "update-candidate",
          candidate: { ...candidate, ...input },
          audit: createAudit(
            state,
            actor,
            "Consultancy",
            "Candidate updated",
            `${input.name} is ${input.progress}.`,
          ),
        });
      },
      recordConsultancyPayment: (candidateId, input, actor) => {
        const candidate = state.consultancy.find((item) => item.id === candidateId);
        if (!candidate) return { ok: false, message: "That candidate is not in this prototype." };
        const entry: LedgerEntry = {
          id: nextId("PAY", paymentIds(state)),
          ...input,
          receivedBy: actor,
        };
        dispatch({
          type: "add-collection",
          candidateId,
          entry,
          audit: createAudit(
            state,
            actor,
            "Consultancy",
            input.kind === "refund" ? "Refund recorded" : "Fee recorded",
            `${input.kind === "refund" ? "Refund" : "Fee"} of ₹${input.amount.toLocaleString("en-IN")} for ${candidate.name}.`,
          ),
        });
        return { ok: true };
      },
      addStaff: (input, actor) => {
        const exists = state.staff.some(
          (item) => item.email.toLowerCase() === input.email.toLowerCase(),
        );
        if (exists) {
          return { ok: false, message: "A staff login with that email already exists." };
        }
        let attendanceIds = state.staff.flatMap((item) => item.attendance.map((entry) => entry.id));
        const attendance: StaffAttendance[] = input.attendance.map((entry) => {
          const id = nextId("STA", attendanceIds);
          attendanceIds = [...attendanceIds, id];
          return { id, date: entry.date, status: entry.status, note: entry.note.trim() };
        });
        const staffUser: StaffUser = {
          id: nextId(
            "STF",
            state.staff.map((item) => item.id),
          ),
          name: input.name.trim(),
          email: input.email.trim(),
          kind: input.kind,
          role: input.role,
          active: input.active,
          password: input.password,
          photo: input.photo,
          contact: input.contact,
          gender: input.gender,
          bloodGroup: input.bloodGroup,
          qualifications: input.qualifications.map((item) => item.title.trim()),
          joinedOn: input.joinedOn,
          relievedOn: input.relievedOn,
          address: input.address.trim(),
          attendance,
          bank: input.bank,
          revisions: [
            {
              id: nextId(
                "SRV",
                state.staff.flatMap((item) => item.revisions.map((revision) => revision.id)),
              ),
              effectiveOn: input.joinedOn,
              amount: input.offeredSalary,
              reason: "Opening offer",
            },
          ],
          transfers: [],
        };
        dispatch({
          type: "add-staff",
          user: staffUser,
          audit: createAudit(
            state,
            actor,
            "Access",
            "Staff onboarded",
            `${staffUser.name} onboarded as ${staffUser.kind.toLowerCase()} staff.`,
          ),
        });
        return { ok: true, id: staffUser.id, email: staffUser.email };
      },
      recordStaffAttendance: (staffId, input, actor) => {
        const person = state.staff.find((item) => item.id === staffId);
        if (!person) return { ok: false, message: "That staff member was not found." };
        if (person.attendance.some((entry) => entry.date === input.date)) {
          return { ok: false, message: "Attendance is already marked for this date." };
        }
        const entry: StaffAttendance = {
          id: nextId(
            "STA",
            state.staff.flatMap((item) => item.attendance.map((mark) => mark.id)),
          ),
          date: input.date,
          status: input.status,
          note: input.note.trim(),
        };
        dispatch({
          type: "update-staff",
          user: { ...person, attendance: [...person.attendance, entry] },
          audit: createAudit(
            state,
            actor,
            "Access",
            "Staff attendance marked",
            `${person.name} marked ${input.status.toLowerCase()} on ${input.date}.`,
          ),
        });
        return { ok: true };
      },
      removeStaffAttendance: (staffId, entryId, actor) => {
        const person = state.staff.find((item) => item.id === staffId);
        const entry = person?.attendance.find((item) => item.id === entryId);
        if (!person || !entry) return { ok: false, message: "That attendance mark is not on this staff member." };
        dispatch({
          type: "update-staff",
          user: { ...person, attendance: person.attendance.filter((item) => item.id !== entryId) },
          audit: createAudit(
            state,
            actor,
            "Access",
            "Staff attendance removed",
            `${person.name} attendance on ${entry.date} was removed.`,
          ),
        });
        return { ok: true };
      },
      updateStaffBank: (staffId, input, actor) => {
        const person = state.staff.find((item) => item.id === staffId);
        if (!person) return { ok: false, message: "That staff member was not found." };
        dispatch({
          type: "update-staff",
          user: { ...person, bank: input },
          audit: createAudit(state, actor, "Access", "Bank details updated", `${person.name} bank details were updated.`),
        });
        return { ok: true };
      },
      reviseStaffSalary: (staffId, input, actor) => {
        const person = state.staff.find((item) => item.id === staffId);
        if (!person) return { ok: false, message: "That staff member was not found." };
        if (person.revisions.some((item) => item.effectiveOn === input.effectiveOn)) {
          return { ok: false, message: "A revision already starts on this date." };
        }
        const revision: SalaryRevision = {
          id: nextId(
            "SRV",
            state.staff.flatMap((item) => item.revisions.map((entry) => entry.id)),
          ),
          effectiveOn: input.effectiveOn,
          amount: input.amount,
          reason: input.reason.trim(),
        };
        dispatch({
          type: "update-staff",
          user: { ...person, revisions: [...person.revisions, revision] },
          audit: createAudit(
            state,
            actor,
            "Access",
            "Salary revised",
            `${person.name} salary revised to ₹${input.amount.toLocaleString("en-IN")} from ${input.effectiveOn}.`,
          ),
        });
        return { ok: true };
      },
      removeSalaryRevision: (staffId, revisionId, actor) => {
        const person = state.staff.find((item) => item.id === staffId);
        const revision = person?.revisions.find((item) => item.id === revisionId);
        if (!person || !revision) return { ok: false, message: "That revision is not on this staff member." };
        if (person.revisions.length <= 1) return { ok: false, message: "Keep at least one offered salary." };
        dispatch({
          type: "update-staff",
          user: { ...person, revisions: person.revisions.filter((item) => item.id !== revisionId) },
          audit: createAudit(
            state,
            actor,
            "Access",
            "Salary revision removed",
            `${person.name} revision from ${revision.effectiveOn} was removed.`,
          ),
        });
        return { ok: true };
      },
      recordSalaryTransfer: (staffId, input, actor) => {
        const person = state.staff.find((item) => item.id === staffId);
        if (!person) return { ok: false, message: "That staff member was not found." };
        const transfer: SalaryTransfer = {
          id: nextId(
            "STR",
            state.staff.flatMap((item) => item.transfers.map((entry) => entry.id)),
          ),
          paidOn: input.paidOn,
          period: input.period,
          amount: input.amount,
          mode: input.mode,
          reference: input.reference.trim(),
          note: input.note.trim(),
        };
        dispatch({
          type: "update-staff",
          user: { ...person, transfers: [...person.transfers, transfer] },
          audit: createAudit(
            state,
            actor,
            "Access",
            "Salary transferred",
            `₹${input.amount.toLocaleString("en-IN")} transferred to ${person.name}.`,
          ),
        });
        return { ok: true };
      },
      removeSalaryTransfer: (staffId, transferId, actor) => {
        const person = state.staff.find((item) => item.id === staffId);
        const transfer = person?.transfers.find((item) => item.id === transferId);
        if (!person || !transfer) return { ok: false, message: "That transfer is not on this staff member." };
        dispatch({
          type: "update-staff",
          user: { ...person, transfers: person.transfers.filter((item) => item.id !== transferId) },
          audit: createAudit(
            state,
            actor,
            "Access",
            "Salary transfer removed",
            `${person.name} transfer on ${transfer.paidOn} was removed.`,
          ),
        });
        return { ok: true };
      },
      setStaffActive: (userId, active, actor) => {
        const target = state.staff.find((item) => item.id === userId);
        if (!target) return { ok: false, message: "That staff login was not found." };
        if (user && target.id === user.id && !active) {
          return { ok: false, message: "You cannot deactivate the login you are using." };
        }
        const remainingAdmins = state.staff.filter(
          (item) => item.role === "Administrator" && item.active && item.id !== target.id,
        );
        if (!active && target.role === "Administrator" && remainingAdmins.length === 0) {
          return { ok: false, message: "Keep at least one active administrator." };
        }
        dispatch({
          type: "set-staff-active",
          userId,
          active,
          audit: createAudit(
            state,
            actor,
            "Access",
            active ? "Login restored" : "Login deactivated",
            `${target.name} is now ${active ? "active" : "inactive"}.`,
          ),
        });
        return { ok: true };
      },
      setPermission: (role, module, level, actor) => {
        if (user && user.role === role && module === "staff" && level !== "write") {
          return { ok: false, message: "Keep edit access to staff on the role you are signed in with." };
        }
        if (state.permissions[role][module] === level) return { ok: true };
        const levelLabel = level === "write" ? "edit" : level === "read" ? "view" : "no access";
        dispatch({
          type: "set-permission",
          role,
          module,
          level,
          audit: createAudit(
            state,
            actor,
            "Access",
            "Permission changed",
            `${role} now has ${levelLabel} on ${module}.`,
          ),
        });
        return { ok: true };
      },
      setExport: (role, allowed, actor) => {
        if (state.exportRoles.includes(role) === allowed) return { ok: true };
        dispatch({
          type: "set-export",
          role,
          allowed,
          audit: createAudit(
            state,
            actor,
            "Access",
            "Export permission changed",
            `${role} ${allowed ? "can" : "cannot"} export reports.`,
          ),
        });
        return { ok: true };
      },
      saveRolePermissions: (permissions, exportRoles, actor) => {
        const nextPermissions = Object.fromEntries(
          (Object.keys(permissions) as Role[]).map((role) => [role, { ...permissions[role] }]),
        ) as Record<Role, Record<ModuleKey, AccessLevel>>;
        (Object.keys(nextPermissions.Administrator) as ModuleKey[]).forEach((module) => {
          nextPermissions.Administrator[module] = "write";
        });
        if (user && nextPermissions[user.role].staff !== "write") {
          return { ok: false, message: "Keep edit access to staff on the role you are signed in with." };
        }
        const nextExport: Role[] = exportRoles.includes("Administrator")
          ? [...exportRoles]
          : ["Administrator", ...exportRoles];
        dispatch({
          type: "save-permissions",
          permissions: nextPermissions,
          exportRoles: nextExport,
          audit: createAudit(state, actor, "Access", "Permissions saved", "Desk role permissions were updated."),
        });
        return { ok: true };
      },
      addCourse: (input, actor) => {
        const exists = state.courses.some(
          (course) => course.name.toLowerCase() === input.name.toLowerCase(),
        );
        if (exists) return { ok: false, message: "A course with that name already exists." };
        const course: CourseOffering = {
          ...input,
          id: nextId(
            "CRS",
            state.courses.map((item) => item.id),
          ),
          syllabus: [],
          feePlans: [],
        };
        dispatch({
          type: "add-course",
          course,
          audit: createAudit(state, actor, "Courses", "Course added", `${course.name} added to the catalogue.`),
        });
        return { ok: true, id: course.id };
      },
      updateCourse: (course, input, actor) => {
        const clash = state.courses.some(
          (item) => item.id !== course.id && item.name.toLowerCase() === input.name.toLowerCase(),
        );
        if (clash) return { ok: false, message: "Another course already uses that name." };
        dispatch({
          type: "update-course",
          course: { ...course, ...input },
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Course updated",
            `${input.name} is ${input.durationWeeks} weeks at ₹${input.fee.toLocaleString("en-IN")}.`,
          ),
        });
        return { ok: true };
      },
      addSyllabusTopic: (courseId, input, actor) => {
        const course = state.courses.find((item) => item.id === courseId);
        if (!course) return { ok: false, message: "That course is not in the catalogue." };
        const topic: SyllabusTopic = {
          ...input,
          id: nextId(
            "SYL",
            state.courses.flatMap((item) => item.syllabus.map((topic) => topic.id)),
          ),
        };
        dispatch({
          type: "add-syllabus",
          courseId,
          topic,
          audit: createAudit(state, actor, "Courses", "Syllabus updated", `${topic.title} added to ${course.name}.`),
        });
        return { ok: true };
      },
      removeSyllabusTopic: (courseId, topicId, actor) => {
        const course = state.courses.find((item) => item.id === courseId);
        const topic = course?.syllabus.find((item) => item.id === topicId);
        dispatch({
          type: "remove-syllabus",
          courseId,
          topicId,
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Syllabus updated",
            `${topic?.title ?? "A topic"} removed from ${course?.name ?? "a course"}.`,
          ),
        });
      },
      addClassSlot: (batchId, input, actor) => {
        const batch = state.batches.find((item) => item.id === batchId);
        if (!batch) return { ok: false, message: "That batch is not on the catalogue." };
        const slot: ClassSlot = {
          ...input,
          id: nextId(
            "SCH",
            state.batches.flatMap((item) => item.schedule.map((slot) => slot.id)),
          ),
        };
        dispatch({
          type: "add-slot",
          batchId,
          slot,
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Schedule updated",
            `${slot.date} ${slot.start} added to ${batch.name}.`,
          ),
        });
        return { ok: true };
      },
      removeClassSlot: (batchId, slotId, actor) => {
        const batch = state.batches.find((item) => item.id === batchId);
        dispatch({
          type: "remove-slot",
          batchId,
          slotId,
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Schedule updated",
            `A class was removed from ${batch?.name ?? "a batch"}.`,
          ),
        });
      },
      addFeePlan: (courseId, input, actor) => {
        const course = state.courses.find((item) => item.id === courseId);
        if (!course) return { ok: false, message: "That course is not in the catalogue." };
        const clash = course.feePlans.some((plan) => plan.name.toLowerCase() === input.name.toLowerCase());
        if (clash) return { ok: false, message: "This course already has a plan with that name." };
        const plan: FeePlan = {
          id: nextId(
            "PLN",
            state.courses.flatMap((item) => item.feePlans.map((feePlan) => feePlan.id)),
          ),
          name: input.name,
          parts: input.parts.map((part) => ({ label: part.label, percent: part.percent, dueOn: part.dueOn })),
        };
        dispatch({
          type: "add-fee-plan",
          courseId,
          plan,
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Fee plan added",
            `${plan.name} added to ${course.name}.`,
          ),
        });
        return { ok: true };
      },
      removeFeePlan: (courseId, planId, actor) => {
        const course = state.courses.find((item) => item.id === courseId);
        const plan = course?.feePlans.find((item) => item.id === planId);
        dispatch({
          type: "remove-fee-plan",
          courseId,
          planId,
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Fee plan removed",
            `${plan?.name ?? "A fee plan"} removed from ${course?.name ?? "a course"}.`,
          ),
        });
      },
      addBatch: (courseId, input, actor) => {
        const course = state.courses.find((item) => item.id === courseId);
        if (!course) return { ok: false, message: "That course is not in the catalogue." };
        const clash = state.batches.some((batch) => batch.name.toLowerCase() === input.name.toLowerCase());
        if (clash) return { ok: false, message: "A batch with that name already exists." };
        const batch: Batch = {
          ...input,
          id: nextId(
            "BAT",
            state.batches.map((item) => item.id),
          ),
          courseId,
          schedule: [],
          staffIds: [],
        };
        dispatch({
          type: "add-batch",
          batch,
          audit: createAudit(state, actor, "Courses", "Batch added", `${batch.name} attached to ${course.name}.`),
        });
        return { ok: true, id: batch.id };
      },
      assignBatchStaff: (batchId, staffId, actor) => {
        const batch = state.batches.find((item) => item.id === batchId);
        const person = state.staff.find((item) => item.id === staffId);
        if (!batch) return { ok: false, message: "That batch is not on the catalogue." };
        if (!person) return { ok: false, message: "That staff member was not found." };
        if (!person.active) return { ok: false, message: "Activate this staff member before assigning them." };
        if (batch.staffIds.includes(person.id)) {
          return { ok: false, message: `${person.name} is already on this batch.` };
        }
        dispatch({
          type: "assign-batch-staff",
          batchId,
          staffId: person.id,
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Staff assigned",
            `${person.name} assigned to ${batch.name}.`,
          ),
        });
        return { ok: true };
      },
      removeBatchStaff: (batchId, staffId, actor) => {
        const batch = state.batches.find((item) => item.id === batchId);
        const person = state.staff.find((item) => item.id === staffId);
        if (!batch) return { ok: false, message: "That batch is not on the catalogue." };
        if (!person || !batch.staffIds.includes(person.id)) {
          return { ok: false, message: "That staff member is not on this batch." };
        }
        dispatch({
          type: "remove-batch-staff",
          batchId,
          staffId: person.id,
          audit: createAudit(
            state,
            actor,
            "Courses",
            "Staff removed",
            `${person.name} removed from ${batch.name}.`,
          ),
        });
        return { ok: true };
      },
      addAdmission: (input, actor) => {
        const course = state.courses.find((item) => item.id === input.courseId);
        const chosen = [...new Set(input.batchIds)]
          .map((id) => state.batches.find((batch) => batch.id === id))
          .filter((batch): batch is Batch => Boolean(batch));
        if (!course || chosen.length !== new Set(input.batchIds).size || chosen.some((batch) => batch.courseId !== course.id)) {
          return { ok: false, message: "Choose batches that belong to the course." };
        }
        const agreement = feeAgreement(course, input.feePlanId);
        if (!agreement.ok) return agreement;
        const enquiry: Enquiry = {
          ...blankProfile(),
          id: nextId(
            "ENQ",
            state.enquiries.map((item) => item.id),
          ),
          enquiryDate: input.joinedOn,
          studentName: input.studentName,
          contact: input.contact,
          email: input.email,
          photo: input.photo,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          bloodGroup: input.bloodGroup,
          qualification: input.qualification,
          address: input.address,
          parentName: input.parentName,
          parentRelation: input.parentRelation,
          parentContact: input.parentContact,
          emergencyName: input.emergencyName,
          emergencyRelation: input.emergencyRelation,
          emergencyContact: input.emergencyContact,
          otherContactName: input.otherContactName,
          otherContact: input.otherContact,
          otherContactNote: input.otherContactNote,
          groupAdded: false,
          source: input.source,
          course: course.name,
          status: "Joined",
          remarks: "Admitted from the admissions desk.",
          followUpDate: "",
          nextActionDate: "",
          nextAction: "",
        };
        const admission: Admission = withBatches(
          {
            id: nextId(
              "ADM",
              state.admissions.map((item) => item.id),
            ),
            enquiryId: enquiry.id,
            batch: "",
            batchId: "",
            batchIds: [],
            status: "Active",
            discontinuedOn: "",
            discontinueReason: "",
            source: input.source,
            referralBonus: input.referralBonus,
            referrerName: input.referrerName,
            agreedFee: input.agreedFee,
            joinedOn: input.joinedOn,
            feePlanName: agreement.feePlanName,
            feeSchedule: agreement.feeSchedule,
            instalments: [],
            attendance: [],
          },
          chosen.map((batch) => batch.id),
          state.batches,
        );
        const placement: InternalPlacement | undefined = course.opensPlacement
          ? {
              id: nextId(
                "PLC",
                state.placements.map((item) => item.id),
              ),
              admissionId: admission.id,
              mockRank: "Unranked",
              company: "",
              salary: "",
              status: "Eligible",
              updatedOn: input.joinedOn,
              notes: "Opened automatically because this student joined a placement-track course.",
            }
          : undefined;
        dispatch({
          type: "admit-student",
          enquiry,
          admission,
          placement,
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Admission added",
            placement
              ? `${input.studentName} joined ${admission.batch}. Internal placement ${placement.id} opened.`
              : `${input.studentName} joined ${admission.batch}.`,
          ),
        });
        return { ok: true, admissionId: admission.id };
      },
      setAdmissionStatus: (admissionId, status, input, actor) => {
        const admission = state.admissions.find((item) => item.id === admissionId);
        if (!admission) return { ok: false, message: "That admission is not in this prototype." };
        const student = state.enquiries.find((item) => item.id === admission.enquiryId);
        const next: Admission = {
          ...admission,
          status,
          discontinuedOn: status === "Discontinued" ? input?.discontinuedOn ?? "" : "",
          discontinueReason: status === "Discontinued" ? input?.discontinueReason ?? "" : "",
        };
        dispatch({
          type: "set-admission-status",
          admission: next,
          audit: createAudit(
            state,
            actor,
            "Admissions",
            status === "Discontinued" ? "Admission discontinued" : `Admission marked ${status.toLowerCase()}`,
            `${student?.studentName ?? "Student"} is now ${status.toLowerCase()}${
              next.discontinueReason ? `: ${next.discontinueReason}` : ""
            }.`,
          ),
        });
        return { ok: true };
      },
      assignAdmissionBatch: (admissionId, batchId, actor) => {
        const admission = state.admissions.find((item) => item.id === admissionId);
        const batch = state.batches.find((item) => item.id === batchId);
        if (!admission || !batch) return { ok: false, message: "Choose a batch that is still on the catalogue." };
        if (admission.batchIds.includes(batch.id)) {
          return { ok: false, message: "This student is already on that batch." };
        }
        const enquiry = state.enquiries.find((item) => item.id === admission.enquiryId);
        dispatch({
          type: "update-admission",
          admission: withBatches(admission, [...admission.batchIds, batch.id], state.batches),
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Batch attached",
            `${enquiry?.studentName ?? "Student"} attached to ${batch.name}.`,
          ),
        });
        return { ok: true };
      },
      detachAdmissionBatch: (admissionId, batchId, actor) => {
        const admission = state.admissions.find((item) => item.id === admissionId);
        const batch = state.batches.find((item) => item.id === batchId);
        if (!admission || !batch || !admission.batchIds.includes(batch.id)) {
          return { ok: false, message: "That batch is not on this admission." };
        }
        if (admission.batchIds.length <= 1) {
          return { ok: false, message: "A student stays on at least one batch." };
        }
        const enquiry = state.enquiries.find((item) => item.id === admission.enquiryId);
        dispatch({
          type: "update-admission",
          admission: withBatches(
            admission,
            admission.batchIds.filter((id) => id !== batch.id),
            state.batches,
          ),
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Batch removed",
            `${enquiry?.studentName ?? "Student"} removed from ${batch.name}.`,
          ),
        });
        return { ok: true };
      },
      updateStudentProfile: (enquiryId, input, actor) => {
        const enquiry = state.enquiries.find((item) => item.id === enquiryId);
        if (!enquiry) return { ok: false, message: "That student is not on an admission." };
        dispatch({
          type: "update-enquiry",
          enquiry: { ...enquiry, ...input },
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Student details updated",
            `Contact details updated for ${enquiry.studentName}.`,
          ),
        });
        return { ok: true };
      },
      recordAttendance: (admissionId, input, actor) => {
        const admission = state.admissions.find((item) => item.id === admissionId);
        const batch = state.batches.find((item) => item.id === input.batchId);
        if (!admission || !batch || !admission.batchIds.includes(batch.id)) {
          return { ok: false, message: "Choose one of this student's batches." };
        }
        if (admission.attendance.some((entry) => entry.date === input.date && entry.batchId === batch.id)) {
          return { ok: false, message: "Attendance is already marked for that batch on this date." };
        }
        const enquiry = state.enquiries.find((item) => item.id === admission.enquiryId);
        const entry = {
          id: nextId(
            "ATT",
            state.admissions.flatMap((item) => item.attendance.map((mark) => mark.id)),
          ),
          date: input.date,
          batchId: batch.id,
          status: input.status,
          note: input.note,
        };
        dispatch({
          type: "update-admission",
          admission: { ...admission, attendance: [...admission.attendance, entry] },
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Attendance marked",
            `${enquiry?.studentName ?? "Student"} marked ${input.status.toLowerCase()} on ${batch.name}.`,
          ),
        });
        return { ok: true };
      },
      removeAttendance: (admissionId, entryId, actor) => {
        const admission = state.admissions.find((item) => item.id === admissionId);
        const entry = admission?.attendance.find((item) => item.id === entryId);
        if (!admission || !entry) return { ok: false, message: "That attendance mark is not on this student." };
        const enquiry = state.enquiries.find((item) => item.id === admission.enquiryId);
        dispatch({
          type: "update-admission",
          admission: { ...admission, attendance: admission.attendance.filter((item) => item.id !== entryId) },
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Attendance removed",
            `${enquiry?.studentName ?? "Student"} attendance on ${entry.date} was removed.`,
          ),
        });
        return { ok: true };
      },
      recordTest: (batchId, input, actor) => {
        const batch = state.batches.find((item) => item.id === batchId);
        const conductor = state.staff.find((item) => item.id === input.staffId);
        if (!batch) return { ok: false, message: "That batch is no longer available." };
        if (
          !conductor ||
          conductor.kind !== "Teaching" ||
          !conductor.active ||
          !batch.staffIds.includes(conductor.id)
        ) {
          return { ok: false, message: "Choose a teaching staff member assigned to this batch." };
        }
        const onThisBatch = state.admissions.filter((admission) => onBatch(admission, batch.id));
        const covered = new Set(input.results.map((result) => result.admissionId));
        if (
          onThisBatch.length === 0 ||
          onThisBatch.some((admission) => !covered.has(admission.id)) ||
          input.results.some((result) => !onThisBatch.some((admission) => admission.id === result.admissionId))
        ) {
          return { ok: false, message: "Record a mark for every student on this batch." };
        }
        if (input.results.some((result) => result.marks > input.maxMarks)) {
          return { ok: false, message: "A mark is higher than the maximum." };
        }
        const test: BatchTest = {
          id: nextId(
            "TST",
            state.tests.map((item) => item.id),
          ),
          batchId: batch.id,
          title: input.title.trim(),
          conductedOn: input.conductedOn,
          staffId: conductor.id,
          maxMarks: input.maxMarks,
          results: input.results.map((result) => ({
            admissionId: result.admissionId,
            marks: result.marks,
            remarks: result.remarks.trim(),
          })),
        };
        dispatch({
          type: "add-test",
          test,
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Test recorded",
            `${test.title} on ${batch.name}, conducted by ${conductor.name}.`,
          ),
        });
        return { ok: true };
      },
      removeTest: (testId, actor) => {
        const test = state.tests.find((item) => item.id === testId);
        if (!test) return { ok: false, message: "That test is no longer on this batch." };
        const batch = state.batches.find((item) => item.id === test.batchId);
        dispatch({
          type: "remove-test",
          testId,
          audit: createAudit(
            state,
            actor,
            "Admissions",
            "Test removed",
            `${test.title} on ${batch?.name ?? "a batch"} was removed.`,
          ),
        });
        return { ok: true };
      },
    };
  }, [ready, state]);

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error("useAcademy must be used within AcademyProvider");
  }
  return context;
}
