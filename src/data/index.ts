import type { Curriculum } from "@/types/plan";
import { cs66Coop } from "./curriculum-cs66-coop";
import { cs66CrossMajor } from "./curriculum-cs66-cross-major";
import { cs66Honors } from "./curriculum-cs66-honors";
import { cs66MinorCoop } from "./curriculum-cs66-minor-coop";
import { cs66MinorIntern } from "./curriculum-cs66-minor-intern";
import { cs66SingleIntern } from "./curriculum-cs66-single-intern";

// รวมหลักสูตร (template แผนการเรียน) ทุกไฟล์ไว้ที่เดียว
// ภาคออกผังใหม่หรือได้ผังของแผนอื่นมา → เพิ่มไฟล์ curriculum ใหม่แล้วใส่ในลิสต์นี้ อย่าแก้ไฟล์เดิมทับ
// เพราะแผนที่ผู้ใช้เก็บไว้ในเบราว์เซอร์อ้าง Slot.id ของไฟล์เดิมอยู่

export type Template = {
  curriculum: Curriculum;
  /** ชื่อที่ผู้ใช้เห็นตอนเลือกแผน */
  label: string;
  /** ชื่อสั้นสำหรับหัวหน้าเว็บ */
  shortLabel: string;
  description: string;
  /** ปีการศึกษาที่เข้าเรียนซึ่งใช้หลักสูตรนี้ (ให้เลือกตอนเริ่มแผน) */
  entryYears: number[];
  /** ช่องที่โชว์เป็นสถิติหัวหน้า เช่น เทอมที่เริ่มออกสหกิจ/ฝึกงาน */
  milestone: { slotId: string; label: string };
};

const CS66_YEARS = [2566, 2567, 2568, 2569, 2570];
const COOP = { slotId: "2301498", label: "เริ่มออกสหกิจ" };
const INTERN = { slotId: "2301398", label: "เริ่มฝึกงาน" };

export const TEMPLATES: Template[] = [
  {
    curriculum: cs66Coop,
    label: "CS-66 เอกเดี่ยว แบบสหกิจศึกษา",
    shortLabel: "เอกเดี่ยว แบบสหกิจ",
    description: "136 หน่วยกิต · สหกิจซัมเมอร์ปี 3 ถึงปี 4 เทอม 1",
    entryYears: CS66_YEARS,
    milestone: COOP,
  },
  {
    curriculum: cs66SingleIntern,
    label: "CS-66 เอกเดี่ยว แบบฝึกงาน",
    shortLabel: "เอกเดี่ยว แบบฝึกงาน",
    description: "136 หน่วยกิต · ฝึกงานซัมเมอร์ปี 3 + CS Project ทั้งปี 4",
    entryYears: CS66_YEARS,
    milestone: INTERN,
  },
  {
    curriculum: cs66MinorCoop,
    label: "CS-66 เอก-โท แบบสหกิจศึกษา",
    shortLabel: "เอก-โท แบบสหกิจ",
    description: "อย่างน้อย 136 หน่วยกิต · วิชาโท 5 วิชา · สหกิจซัมเมอร์ปี 3 ถึงปี 4 เทอม 1",
    entryYears: CS66_YEARS,
    milestone: COOP,
  },
  {
    curriculum: cs66MinorIntern,
    label: "CS-66 เอก-โท แบบฝึกงาน",
    shortLabel: "เอก-โท แบบฝึกงาน",
    description: "อย่างน้อย 136 หน่วยกิต · วิชาโท 5 วิชา · ฝึกงานซัมเมอร์ปี 3 + CS Project",
    entryYears: CS66_YEARS,
    milestone: INTERN,
  },
  {
    curriculum: cs66Honors,
    label: "CS-66 เกียรตินิยม (Honor program)",
    shortLabel: "เกียรตินิยม",
    description: "137 หน่วยกิต · ฝึกงาน + Workshop, Indiv, CS Research",
    entryYears: CS66_YEARS,
    milestone: INTERN,
  },
  {
    curriculum: cs66CrossMajor,
    label: "CS-66 ควบตรี-โท 4+1 (ควบข้ามสาขา)",
    shortLabel: "ควบตรี-โท 4+1",
    description: "136 หน่วยกิต · ต้องได้อย่างน้อย 120 หน่วยกิตภายในปี 3 · ฝึกงาน + CS Project",
    entryYears: CS66_YEARS,
    milestone: INTERN,
  },
];

export function templateFor(curriculumId: string): Template | undefined {
  return TEMPLATES.find((t) => t.curriculum.id === curriculumId);
}

export function curriculumFor(id: string): Curriculum {
  const t = templateFor(id);
  if (!t) throw new Error(`ไม่พบหลักสูตร ${id} ใน src/data/index.ts`);
  return t.curriculum;
}
