"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { nextId, paymentIds } from "@/lib/records";
import type {
  ConsultancyInput,
  EnquiryInput,
  ExpenseInput,
  FollowUpInput,
  JoinInput,
  LedgerInput,
  PlacementInput,
  StaffInput,
} from "@/lib/schemas";
import { createSeed } from "@/lib/seed";
import type {
  AcademyData,
  Admission,
  AuditEvent,
  ConsultancyCandidate,
  Enquiry,
  Expense,
  InternalPlacement,
  LedgerEntry,
  StaffUser,
} from "@/lib/types";

const SESSION_KEY = "tm.session";

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
  | { type: "set-staff-active"; userId: string; active: boolean; audit: AuditEvent };

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
    case "set-staff-active":
      return {
        ...state,
        staff: state.staff.map((user) =>
          user.id === action.userId ? { ...user, active: action.active } : user,
        ),
        audit: [action.audit, ...state.audit],
      };
    default:
      return state;
  }
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
  addStaff: (input: StaffInput, actor: string) => Success<{ email: string }> | Failure;
  setStaffActive: (
    userId: string,
    active: boolean,
    actor: string,
  ) => Success | Failure;
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
        const admission: Admission = {
          id: nextId(
            "ADM",
            state.admissions.map((item) => item.id),
          ),
          enquiryId: enquiry.id,
          batch: input.batch,
          source: enquiry.source,
          referralBonus: input.referralBonus,
          referrerName: input.referrerName,
          agreedFee: input.agreedFee,
          joinedOn: input.joinedOn,
          instalments: [],
        };
        const placement: InternalPlacement | undefined =
          enquiry.course === "Software Testing"
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
        const staffUser: StaffUser = {
          ...input,
          id: nextId(
            "STF",
            state.staff.map((item) => item.id),
          ),
        };
        dispatch({
          type: "add-staff",
          user: staffUser,
          audit: createAudit(
            state,
            actor,
            "Access",
            "Staff login added",
            `${staffUser.name} added as ${staffUser.role}.`,
          ),
        });
        return { ok: true, email: staffUser.email };
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
