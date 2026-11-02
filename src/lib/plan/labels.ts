import type { Category, GenEdType, Grade, StatusEdit } from "@/types/plan";

export const STATUS_LABEL: Record<StatusEdit["status"], string> = {
  none: "ยังไม่ได้ลง",
  planned: "วางแผนไว้",
  enrolled: "กำลังเรียน",
  passed: "ผ่านแล้ว",
  failed: "ตก",
  withdrawn: "ถอน (W)",
};

/** เกรดที่เลือกได้ตามสถานะ — ถอนได้ W อัตโนมัติ สถานะอื่นไม่มีเกรด */
export const GRADES_FOR: Partial<Record<StatusEdit["status"], Grade[]>> = {
  passed: ["A", "B+", "B", "C+", "C", "D+", "D", "S"],
  failed: ["F", "U"],
};

// ข้อความที่แสดงในเว็บ รวมไว้ที่เดียว ไม่ hardcode กระจายใน component

export const CATEGORY_LABEL: Record<Category, string> = {
  core: "วิชาเอก",
  sci: "วิทย์พื้นฐาน",
  eng: "ภาษาอังกฤษ",
  elective: "วิชาเลือกเอก",
  gened: "Gen Ed",
  free: "เลือกเสรี",
  coop: "สหกิจ / ฝึกงาน",
  minor: "วิชาโท",
  honors: "วิชาเกียรตินิยม",
};

/** ประเภท Gen Ed ตามที่ CuGetReg ใช้ */
export const GEN_ED_LABEL: Record<Exclude<GenEdType, "NO">, string> = {
  SO: "สังคมศาสตร์",
  HU: "มนุษยศาสตร์",
  SC: "วิทยาศาสตร์",
  IN: "สหศาสตร์",
};
