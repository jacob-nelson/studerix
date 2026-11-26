export type Period = "today" | "week" | "month" | "all" | "custom";

export function yearsOfAge(iso: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1;
  return age >= 0 ? age : null;
}

export function daysUntil(iso: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const due = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86_400_000);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function weekdayLabel(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
}

export function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = copy.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

export function periodBounds(
  period: Period,
  customFrom: string,
  customTo: string,
  now = new Date(),
) {
  if (period === "all") return { from: "0000-01-01", to: "9999-12-31" };
  if (period === "custom") {
    const from = customFrom || "0000-01-01";
    const to = customTo || "9999-12-31";
    return from <= to ? { from, to } : { from: to, to: from };
  }
  if (period === "today") {
    const today = isoDate(now);
    return { from: today, to: today };
  }
  if (period === "week") {
    return { from: isoDate(startOfWeek(now)), to: isoDate(now) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: isoDate(start), to: isoDate(now) };
}

export function calendarYearBounds(now = new Date()) {
  return { from: `${now.getFullYear()}-01-01`, to: isoDate(now) };
}

export function inPeriod(iso: string, from: string, to: string) {
  return Boolean(iso) && iso >= from && iso <= to;
}

export function suggestedBatch(course: string) {
  if (course === "Software Testing") return "ST-Nov-2026";
  if (course === "Full Stack Development") return "FS-Oct-2026";
  if (course === "Data Analytics") return "DA-Nov-2026";
  return "PY-Jan-2027";
}

export function addWeeks(iso: string, weeks: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + weeks * 7);
  return isoDate(date);
}

export function suggestedFee(course: string) {
  if (course === "Software Testing") return 55000;
  if (course === "Full Stack Development") return 72000;
  if (course === "Data Analytics") return 60000;
  if (course === "DevOps") return 65000;
  return 40000;
}
