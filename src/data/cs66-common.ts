import type { Edge, PlanTerm, Slot } from "@/types/plan";

// ส่วนที่ผังของภาค CS-66 ทุกแผน (09-01-2026) วาดเหมือนกันทุกกล่องทุกลูกศร: วิชาแกนปี 1–3, วิทย์พื้นฐาน, ภาษาอังกฤษ
// ใช้ร่วมกันในไฟล์ curriculum ของแต่ละแผน ไฟล์เอกเดี่ยว-สหกิจ (curriculum-cs66-coop.ts) ถอดไว้ก่อน จึงยังไม่ได้ใช้ไฟล์นี้
// กติกา id: วิชาที่มีรหัส id = รหัสวิชา · รหัสซ้ำในผังเดียว (วิชาต่อเนื่องทั้งปี) ต่อท้าย -1/-2 · ช่องว่างใช้ elec-N gen-N free-N minor-N
// id ที่ตรงกันข้ามแผนทำให้ผู้ใช้เปลี่ยนแผนแล้วเกรด/วิชาที่เติมไว้ตามไปด้วย

const t = (year: 1 | 2 | 3 | 4, sem: 1 | 2 | "S"): PlanTerm => ({ year, sem });

export const CS66_CORE_SLOTS: Slot[] = [
  // แถว 0–1: คณิต
  { id: "2301107", code: "2301107", name: "Calculus I", credits: 3, category: "core", term: t(1, 1), row: 0 },
  { id: "2301108", code: "2301108", name: "Calculus II", credits: 3, category: "core", term: t(1, 2), row: 0 },
  { id: "2301286", code: "2301286", name: "Prob Stat", credits: 3, category: "core", term: t(2, 1), row: 0 },
  { id: "2301234", code: "2301234", name: "Linear Algebra", credits: 3, category: "core", term: t(2, 2), row: 0 },
  { id: "2301220", code: "2301220", name: "Math Model", credits: 3, category: "core", term: t(1, 2), row: 1 },
  { id: "2301230", code: "2301230", name: "Discrete CS", credits: 2, category: "core", term: t(2, 1), row: 1 },
  { id: "2301379", code: "2301379", name: "TC", credits: 3, category: "core", term: t(3, 1), row: 1, note: "Theory of Computation" },
  // แถว 2–4: สายโปรแกรมมิ่ง/ระบบ
  { id: "2301173", code: "2301173", name: "Programming", credits: 4, category: "core", term: t(1, 1), row: 2 },
  { id: "2301260", code: "2301260", name: "Prog Tech", credits: 4, category: "core", term: t(1, 2), row: 2 },
  { id: "2301265", code: "2301265", name: "DSA", credits: 4, category: "core", term: t(2, 1), row: 2 },
  { id: "2301266", code: "2301266", name: "Elem Data Lit", credits: 3, category: "core", term: t(2, 2), row: 2 },
  { id: "2304121", code: "2304121", name: "Physics", credits: 3, category: "sci", term: t(1, 1), row: 3 },
  { id: "2301375", code: "2301375", name: "Database", credits: 3, category: "core", term: t(2, 2), row: 3 },
  { id: "2301367", code: "2301367", name: "SE", credits: 3, category: "core", term: t(3, 1), row: 3 },
  { id: "2301360", code: "2301360", name: "Info Sys Mgt", credits: 3, category: "core", term: t(3, 2), row: 3 },
  { id: "2304181", code: "2304181", name: "Phys Lab", credits: 1, category: "sci", term: t(1, 1), row: 4 },
  { id: "2301180", code: "2301180", name: "Explore CS", credits: 2, category: "core", term: t(1, 2), row: 4 },
  { id: "2301274", code: "2301274", name: "Comp Sys", credits: 3, category: "core", term: t(2, 1), row: 4 },
  { id: "2301275", code: "2301275", name: "Comp Network", credits: 3, category: "core", term: t(2, 2), row: 4 },
  { id: "2301371", code: "2301371", name: "OS", credits: 3, category: "core", term: t(3, 1), row: 4 },
  // แถว 5–6: วิทย์พื้นฐาน (สายสหกิจ/ฝึกงานอยู่ในไฟล์ของแต่ละแผน)
  { id: "2303107", code: "2303107", name: "Gen Bio", credits: 3, category: "sci", term: t(1, 1), row: 5 },
  { id: "2302161", code: "2302161", name: "Gen Chem", credits: 3, category: "sci", term: t(1, 2), row: 5 },
  { id: "2301399", code: "2301399", name: "Project Proposal", credits: 1, category: "core", term: t(3, 2), row: 5 },
  { id: "2303108", code: "2303108", name: "Gen Bio Lab", credits: 1, category: "sci", term: t(1, 1), row: 6 },
  { id: "2302113", code: "2302113", name: "Gen Chem Lab", credits: 1, category: "sci", term: t(1, 2), row: 6 },
  { id: "2301480", code: "2301480", name: "Seminar CS", credits: 1, category: "core", term: t(4, 2), row: 6 },
  // แถว 7: ภาษาอังกฤษ
  { id: "5500111", code: "5500111", name: "Exp Eng I", credits: 3, category: "eng", term: t(1, 1), row: 7 },
  { id: "5500112", code: "5500112", name: "Exp Eng II", credits: 3, category: "eng", term: t(1, 2), row: 7 },
  { id: "5500204", code: "5500204", name: "EAP I", credits: 3, category: "eng", term: t(2, 2), row: 7 },
  { id: "5500496", code: "5500496", name: "Comm Sci Tech", credits: 3, category: "eng", term: t(3, 2), row: 7 },
];

const pre = (from: string, to: string): Edge => ({ from, to, kind: "prereq" });
const co = (from: string, to: string): Edge => ({ from, to, kind: "coreq" });

export const CS66_CORE_EDGES: Edge[] = [
  pre("2301107", "2301108"),
  pre("2301107", "2301286"),
  pre("2301220", "2301230"),
  co("2301220", "2301234"),
  co("2301286", "2301266"),
  pre("2301230", "2301379"),
  pre("2301173", "2301260"),
  pre("2301173", "2301180"),
  pre("2301173", "2301266"),
  pre("2301173", "2301275"),
  pre("2301173", "2301360"),
  pre("2301260", "2301265"),
  pre("2301260", "2301274"),
  pre("2301265", "2301375"),
  pre("2301265", "2301371"),
  pre("2301274", "2301371"),
  pre("2301375", "2301367"),
  co("2304121", "2304181"),
  co("2303107", "2303108"),
  co("2302161", "2302113"),
  pre("5500111", "5500112"),
  pre("5500112", "5500204"),
  pre("5500204", "5500496"),
];

/** สายสหกิจ: Pre-CoOp (ปี 3 เทอม 2) → CoOp 6 หน่วยกิต กินซัมเมอร์ปี 3 + ปี 4 เทอม 1 */
export const CS66_COOP_TRACK: { slots: Slot[]; edges: Edge[] } = {
  slots: [
    { id: "2300398", code: "2300398", name: "Pre-CoOp Ed", credits: 1, category: "core", term: t(3, 2), row: 6 },
    { id: "2301498", code: "2301498", name: "CoOp Ed", credits: 6, category: "coop", term: t(3, "S"), row: 6, span: 2, registerTerm: t(4, 1), note: "ลงทะเบียนปี 4 เทอม 1" },
  ],
  edges: [pre("2300398", "2301498")],
};

/**
 * สายฝึกงาน: Pre-CS Intern (ปี 3 เทอม 2) → CS Internship ซัมเมอร์ปี 3 (ลงทะเบียนปี 4 เทอม 1)
 * → CS Project 1.5+1.5 ต่อเนื่องทั้งปี 4 · Project Proposal เป็น corequisite (เส้นประ) ของ CS Project ตามผัง
 */
export const CS66_INTERN_TRACK: { slots: Slot[]; edges: Edge[] } = {
  slots: [
    { id: "2301397", code: "2301397", name: "Pre-CS Intern", credits: 1, category: "core", term: t(3, 2), row: 6 },
    { id: "2301398", code: "2301398", name: "CS Internship", credits: 3, category: "coop", term: t(3, "S"), row: 5, registerTerm: t(4, 1), note: "ลงทะเบียนปี 4 เทอม 1" },
    { id: "2301487-1", code: "2301487", name: "CS Project", credits: 1.5, category: "coop", term: t(4, 1), row: 5, note: "วิชาต่อเนื่องทั้งปี (ต่อปี 4 เทอม 2)" },
    { id: "2301487-2", code: "2301487", name: "CS Project", credits: 1.5, category: "coop", term: t(4, 2), row: 5, note: "วิชาต่อเนื่องทั้งปี (ต่อจากปี 4 เทอม 1)" },
  ],
  edges: [
    pre("2301397", "2301398"),
    co("2301398", "2301487-1"),
    co("2301399", "2301487-1"),
    pre("2301487-1", "2301487-2"),
  ],
};

/** ช่องว่างให้เติมวิชาเอง [id, ชื่อ, หมวด, ปี, เทอม, แถว] — ทุกช่อง 3 หน่วยกิต */
export function openSlots(rows: [string, string, Slot["category"], 1 | 2 | 3 | 4, 1 | 2 | "S", number][]): Slot[] {
  return rows.map(([id, name, category, year, sem, row]) => ({ id, name, credits: 3, category, term: t(year, sem), row }));
}

export { pre, co, t };
