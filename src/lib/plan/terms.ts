import type { AcademicTerm, PlanTerm } from "@/types/plan";

// แปลงเทอมสองระบบ: PlanTerm (ชั้นปีในผัง) ↔ AcademicTerm (ปีการศึกษาจริงในใบเกรด/CuGetReg)

const SEM_ORDER = { 1: 0, 2: 1, S: 2 } as const;

/** ค่าเรียงลำดับเทอม ใช้เทียบก่อน/หลัง (ซัมเมอร์อยู่หลังเทอม 2 ของปีเดียวกัน) */
export const termIndex = (t: PlanTerm) => t.year * 3 + SEM_ORDER[t.sem];

export const sameTerm = (a: PlanTerm, b: PlanTerm) => a.year === b.year && a.sem === b.sem;

export const termKey = (t: PlanTerm) => `${t.year}-${t.sem}`;

/** ปีที่ = ปีการศึกษา − entryYear + 1 */
export function toAcademic(t: PlanTerm, entryYear: number): AcademicTerm {
  return `${entryYear + t.year - 1}/${t.sem}`;
}

export function toPlan(t: AcademicTerm, entryYear: number): PlanTerm | null {
  const [y, s] = t.split("/");
  const year = Number(y) - entryYear + 1;
  const sem = s === "S" ? "S" : (Number(s) as 1 | 2);
  if (year < 1 || year > 4) return null;
  return { year: year as PlanTerm["year"], sem };
}

/** หัวคอลัมน์แบบเดียวกับผังของภาค (ภาษาอังกฤษตามต้นฉบับ) */
export const termLabel = (t: PlanTerm) =>
  `Year ${t.year} / ${t.sem === "S" ? "Summer" : `Sem ${t.sem}`}`;

/** ชื่อเทอมภาษาไทยสำหรับข้อความในหน้าเว็บ */
export const termLabelTh = (t: PlanTerm) =>
  `ปี ${t.year} ${t.sem === "S" ? "ซัมเมอร์" : `เทอม ${t.sem}`}`;

/** ย้อนเทอมทีละหนึ่งตามปีการศึกษา (2570/1 → 2569/S → 2569/2 → 2569/1 …) */
export function previousAcademicTerms(from: AcademicTerm, count: number): AcademicTerm[] {
  const out: AcademicTerm[] = [];
  const [y, first] = from.split("/") as [string, string];
  let s = first;
  let year = Number(y);
  for (let i = 0; i < count; i++) {
    if (s === "1") {
      year -= 1;
      s = "S";
    } else if (s === "S") s = "2";
    else s = "1";
    out.push(`${year}/${s}` as AcademicTerm);
  }
  return out;
}

export const ACADEMIC_TERM_RE = /^\d{4}\/(1|2|S)$/;
