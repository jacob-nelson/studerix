export type Period = "today" | "week" | "month" | "all" | "custom";

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

export function inPeriod(iso: string, from: string, to: string) {
  return Boolean(iso) && iso >= from && iso <= to;
}

export function suggestedBatch(course: string) {
  if (course === "Software Testing") return "ST-Nov-2026";
  if (course === "Full Stack Development") return "FS-Oct-2026";
  if (course === "Data Analytics") return "DA-Nov-2026";
  return "PY-Jan-2027";
}

export function suggestedFee(course: string) {
  if (course === "Software Testing") return 55000;
  if (course === "Full Stack Development") return 72000;
  if (course === "Data Analytics") return 60000;
  if (course === "DevOps") return 65000;
  return 40000;
}
