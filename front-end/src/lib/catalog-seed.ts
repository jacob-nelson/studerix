import type { Batch, CourseOffering, FeePlan } from "@/lib/types";

function fullPlan(id: string): FeePlan {
  return { id, name: "Full payment in advance", parts: [{ label: "On joining", percent: 100 }] };
}

function halfPlan(id: string): FeePlan {
  return {
    id,
    name: "50% in advance",
    parts: [
      { label: "On joining", percent: 50 },
      { label: "Before the midpoint", percent: 50 },
    ],
  };
}

export const seedCourses: CourseOffering[] = [
  {
    id: "CRS-0001",
    name: "Software Testing",
    durationWeeks: 16,
    fee: 55000,
    summary: "Manual testing, automation, and a placement track.",
    opensPlacement: true,
    syllabus: [
      { id: "SYL-0001", title: "Testing fundamentals and test design", hours: 24 },
      { id: "SYL-0002", title: "Selenium and API automation", hours: 36 },
      { id: "SYL-0003", title: "Projects, mocks, and interview practice", hours: 20 },
    ],
    feePlans: [
      fullPlan("PLN-0001"),
      halfPlan("PLN-0002"),
      {
        id: "PLN-0003",
        name: "Three instalments",
        parts: [
          { label: "On joining", percent: 40 },
          { label: "Week 6", percent: 30 },
          { label: "Before completion", percent: 30 },
        ],
      },
    ],
  },
  {
    id: "CRS-0002",
    name: "Full Stack Development",
    durationWeeks: 20,
    fee: 72000,
    summary: "Web fundamentals through a deployed full-stack project.",
    opensPlacement: false,
    syllabus: [
      { id: "SYL-0004", title: "HTML, CSS, and JavaScript", hours: 30 },
      { id: "SYL-0005", title: "React and APIs", hours: 40 },
      { id: "SYL-0006", title: "Node, databases, and deployment", hours: 30 },
    ],
    feePlans: [fullPlan("PLN-0004"), halfPlan("PLN-0005")],
  },
  {
    id: "CRS-0003",
    name: "Data Analytics",
    durationWeeks: 12,
    fee: 60000,
    summary: "Spreadsheets, SQL, and a dashboard project.",
    opensPlacement: false,
    syllabus: [
      { id: "SYL-0007", title: "Excel and data cleaning", hours: 16 },
      { id: "SYL-0008", title: "SQL for analysis", hours: 24 },
      { id: "SYL-0009", title: "Dashboards and storytelling", hours: 16 },
    ],
    feePlans: [fullPlan("PLN-0006"), halfPlan("PLN-0007")],
  },
  {
    id: "CRS-0004",
    name: "Python Programming",
    durationWeeks: 8,
    fee: 40000,
    summary: "Python basics through small programs and a final script.",
    opensPlacement: false,
    syllabus: [
      { id: "SYL-0010", title: "Syntax, functions, and files", hours: 16 },
      { id: "SYL-0011", title: "Data handling and a capstone script", hours: 16 },
    ],
    feePlans: [fullPlan("PLN-0008"), halfPlan("PLN-0009")],
  },
  {
    id: "CRS-0005",
    name: "DevOps",
    durationWeeks: 12,
    fee: 65000,
    summary: "Linux, Git, and a first deployment pipeline.",
    opensPlacement: false,
    syllabus: [
      { id: "SYL-0012", title: "Linux and Git", hours: 16 },
      { id: "SYL-0013", title: "CI and containers", hours: 24 },
    ],
    feePlans: [fullPlan("PLN-0010"), halfPlan("PLN-0011")],
  },
];

const weekdayTesting = (ids: [string, string, string]): Batch["schedule"] => [
  { id: ids[0], day: "Mon", start: "09:30", end: "12:30", topic: "Concepts and labs" },
  { id: ids[1], day: "Wed", start: "09:30", end: "12:30", topic: "Automation practice" },
  { id: ids[2], day: "Fri", start: "09:30", end: "12:30", topic: "Review and mocks" },
];

export const seedBatches: Batch[] = [
  {
    id: "BAT-0001",
    courseId: "CRS-0001",
    name: "ST-Sep-2026",
    startsOn: "2026-09-07",
    endsOn: "2026-12-25",
    schedule: weekdayTesting(["SCH-0001", "SCH-0002", "SCH-0003"]),
    staffIds: ["STF-0007", "STF-0008"],
  },
  {
    id: "BAT-0002",
    courseId: "CRS-0001",
    name: "ST-Nov-2026",
    startsOn: "2026-11-02",
    endsOn: "2027-02-19",
    schedule: weekdayTesting(["SCH-0004", "SCH-0005", "SCH-0006"]),
    staffIds: ["STF-0008", "STF-0009"],
  },
  {
    id: "BAT-0003",
    courseId: "CRS-0002",
    name: "FS-Oct-2026",
    startsOn: "2026-10-05",
    endsOn: "2027-02-19",
    schedule: [
      { id: "SCH-0007", day: "Tue", start: "10:00", end: "13:00", topic: "Frontend" },
      { id: "SCH-0008", day: "Thu", start: "10:00", end: "13:00", topic: "Backend" },
    ],
    staffIds: ["STF-0007"],
  },
  {
    id: "BAT-0004",
    courseId: "CRS-0003",
    name: "DA-Nov-2026",
    startsOn: "2026-11-09",
    endsOn: "2027-01-29",
    schedule: [
      { id: "SCH-0009", day: "Mon", start: "14:00", end: "17:00", topic: "Tools" },
      { id: "SCH-0010", day: "Wed", start: "14:00", end: "17:00", topic: "Project clinic" },
    ],
    staffIds: [],
  },
  {
    id: "BAT-0005",
    courseId: "CRS-0004",
    name: "PY-Jan-2027",
    startsOn: "2027-01-04",
    endsOn: "2027-02-26",
    schedule: [{ id: "SCH-0011", day: "Sat", start: "09:30", end: "13:00", topic: "Weekend class" }],
    staffIds: [],
  },
];
