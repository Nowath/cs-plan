import { templateFor } from "@/data";
import type {
  AcademicTerm,
  Curriculum,
  Enrollment,
  GenEdType,
  Grade,
  PickedCourse,
  PlanDoc,
  StatusEdit,
  Student,
} from "@/types/plan";
import { isFillable } from "./build";
import { GRADES_FOR } from "./labels";
import { ACADEMIC_TERM_RE } from "./terms";

// การแก้แผนทั้งหมดเป็น pure function บน PlanDoc (คืน doc ใหม่ ไม่แก้ของเดิม)
// แยกจาก store เพื่อให้ทดสอบได้โดยไม่ต้องมีเบราว์เซอร์ และใช้ตรวจไฟล์ที่นำเข้าด้วยกติกาเดียวกัน

const touch = (doc: PlanDoc, patch: Partial<PlanDoc>): PlanDoc => ({
  ...doc,
  ...patch,
  updatedAt: new Date().toISOString(),
});

export function emptyDoc(curriculumId: string, entryYear: number): PlanDoc {
  return {
    version: 1,
    base: { entryYear, curriculumId, enrollments: [], slotMoves: [] },
    edits: { fills: {}, status: {} },
    updatedAt: new Date().toISOString(),
  };
}

const isCurrentAttempt = (e: Enrollment) =>
  e.status === "planned" || e.status === "enrolled" || e.status === "passed";

/** เติม/เปลี่ยน/ล้างวิชาในช่องว่าง */
export function setFill(doc: PlanDoc, curriculum: Curriculum, slotId: string, course: PickedCourse | null): PlanDoc {
  const slot = curriculum.slots.find((s) => s.id === slotId);
  if (!slot || !isFillable(slot)) throw new Error("ช่องนี้เติมวิชาเองไม่ได้");
  const fills = { ...doc.edits.fills };
  const status = { ...doc.edits.status };
  if (course) fills[slotId] = course;
  else {
    // ล้างช่องที่ base มีวิชาอยู่ต้องเก็บเป็น null ไว้ ส่วนช่องที่เติมจากเว็บอย่างเดียวลบ key ทิ้งได้เลย
    const hasBase = doc.base.enrollments.some((e) => e.fillsSlot === slotId && isCurrentAttempt(e));
    if (hasBase) fills[slotId] = null;
    else delete fills[slotId];
    // ไม่มีวิชาแล้ว สถานะ/เกรดที่ตั้งไว้ก็ไม่มีความหมาย ถ้าค้างไว้จะไปติดกับวิชาใหม่ที่เลือกทีหลัง
    delete status[slotId];
  }
  return touch(doc, { edits: { fills, status } });
}

/** ตั้งสถานะ/เกรด/เทอม · null = คืนค่าตาม base */
export function setStatus(doc: PlanDoc, curriculum: Curriculum, slotId: string, edit: StatusEdit | null): PlanDoc {
  const slot = curriculum.slots.find((s) => s.id === slotId);
  if (!slot) throw new Error("ไม่พบช่องนี้ในผัง");
  if (edit) {
    if (!validStatusEdit(edit)) throw new Error("สถานะ เกรด หรือเทอมไม่ถูกต้อง");
    const fill = doc.edits.fills[slotId];
    const hasCourse =
      !!slot.code || !!fill || (fill !== null && doc.base.enrollments.some((e) => e.fillsSlot === slotId));
    if (!hasCourse) throw new Error("ช่องนี้ยังไม่มีวิชา เลือกวิชาก่อน");
  }
  const status = { ...doc.edits.status };
  if (edit) status[slotId] = edit;
  else delete status[slotId];
  return touch(doc, { edits: { ...doc.edits, status } });
}

/**
 * เปลี่ยน template: ประวัติการลงเรียนเก็บไว้ทั้งหมด (ยังนับ GPA) แต่การผูกกับช่องที่ไม่มีในแผนใหม่ต้องตัดออก
 * ช่องที่มีรหัสวิชาเหมือนกันใช้ id เดียวกัน (= รหัสวิชา) จึงย้ายข้ามแผนได้เอง
 */
export function switchTemplate(doc: PlanDoc, next: Curriculum): { doc: PlanDoc; dropped: number } {
  const ids = new Set(next.slots.map((s) => s.id));
  let dropped = 0;
  const enrollments = doc.base.enrollments.map((e) => {
    if (!e.fillsSlot || ids.has(e.fillsSlot)) return e;
    dropped++;
    return { ...e, fillsSlot: undefined };
  });
  const keep = <T,>(rec: Record<string, T>) => {
    const out: Record<string, T> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (ids.has(k)) out[k] = v;
      else dropped++;
    }
    return out;
  };
  const base: Student = {
    ...doc.base,
    curriculumId: next.id,
    enrollments,
    slotMoves: doc.base.slotMoves.filter((m) => ids.has(m.slotId)),
  };
  return {
    doc: touch(doc, { base, edits: { fills: keep(doc.edits.fills), status: keep(doc.edits.status) } }),
    dropped,
  };
}

// ---------- ตรวจไฟล์ที่นำเข้า ----------
// ไฟล์มาจากผู้ใช้ (อาจแก้มือหรือผิดรูป) ตรวจทุกช่องก่อนรับ ห้ามเชื่อว่าเป็น PlanDoc ตาม type

const STATUSES: Enrollment["status"][] = ["planned", "enrolled", "passed", "failed", "withdrawn"];
const GRADES: Grade[] = ["A", "B+", "B", "C+", "C", "D+", "D", "F", "S", "U", "W", "I"];
const GEN_ED: GenEdType[] = ["SO", "HU", "SC", "IN", "NO"];

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown, max = 200): v is string => typeof v === "string" && v.length <= max;
const isTerm = (v: unknown): v is AcademicTerm => typeof v === "string" && ACADEMIC_TERM_RE.test(v);
const isCredits = (v: unknown): v is number => typeof v === "number" && v >= 0 && v <= 12;

function validStatusEdit(v: unknown): v is StatusEdit {
  if (!isObj(v) || !isTerm(v.term)) return false;
  const status = v.status as StatusEdit["status"];
  if (status !== "none" && !STATUSES.includes(status as Enrollment["status"])) return false;
  const allowed = GRADES_FOR[status];
  if (allowed) return allowed.includes(v.grade as Grade);
  return v.grade === undefined;
}

function validCourse(v: unknown): v is PickedCourse {
  return (
    isObj(v) && isStr(v.code, 12) && /^\d{7}$/.test(v.code) && isStr(v.name, 120) && isCredits(v.credits) &&
    (v.genEdType === undefined || GEN_ED.includes(v.genEdType as GenEdType))
  );
}

function validEnrollment(v: unknown): v is Enrollment {
  return (
    isObj(v) && isTerm(v.term) && isStr(v.code, 12) && isStr(v.name, 120) && isCredits(v.credits) &&
    STATUSES.includes(v.status as Enrollment["status"]) &&
    (v.grade === undefined || GRADES.includes(v.grade as Grade)) &&
    (v.fillsSlot === undefined || isStr(v.fillsSlot, 40)) &&
    (v.slotUnconfirmed === undefined || typeof v.slotUnconfirmed === "boolean")
  );
}

function validMove(v: unknown): boolean {
  if (!isObj(v) || !isStr(v.slotId, 40) || !isStr(v.reason, 300) || !isObj(v.to)) return false;
  const { year, sem } = v.to;
  return [1, 2, 3, 4].includes(year as number) && [1, 2, "S"].includes(sem as 1) &&
    (v.row === undefined || (typeof v.row === "number" && v.row >= 0 && v.row < 40));
}

export function parsePlanDoc(raw: unknown): { ok: true; doc: PlanDoc } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!isObj(raw) || raw.version !== 1) return fail("ไม่ใช่ไฟล์แผนการเรียนของเว็บนี้ (หรือเป็นเวอร์ชันที่ไม่รองรับ)");
  const { base, edits } = raw;
  if (!isObj(base) || !isObj(edits)) return fail("ไฟล์ไม่ครบ: ไม่มี base หรือ edits");
  if (typeof base.entryYear !== "number" || base.entryYear < 2500 || base.entryYear > 2700) {
    return fail("ปีที่เข้าเรียนในไฟล์ไม่ถูกต้อง");
  }
  if (!isStr(base.curriculumId, 60) || !templateFor(base.curriculumId)) {
    return fail("ไฟล์นี้ใช้แผนการเรียนที่เว็บยังไม่มี");
  }
  if (!Array.isArray(base.enrollments) || !base.enrollments.every(validEnrollment)) {
    return fail("รายวิชาในไฟล์มีข้อมูลผิดรูปแบบ");
  }
  if (!Array.isArray(base.slotMoves) || !base.slotMoves.every(validMove)) return fail("การย้ายช่องในไฟล์ผิดรูปแบบ");
  if (!isObj(edits.fills) || !Object.values(edits.fills).every((v) => v === null || validCourse(v))) {
    return fail("วิชาที่เติมในไฟล์ผิดรูปแบบ");
  }
  if (!isObj(edits.status) || !Object.values(edits.status).every(validStatusEdit)) {
    return fail("สถานะ/เกรดในไฟล์ผิดรูปแบบ");
  }
  return {
    ok: true,
    doc: {
      version: 1,
      base: base as unknown as Student,
      edits: { fills: edits.fills as PlanDoc["edits"]["fills"], status: edits.status as PlanDoc["edits"]["status"] },
      updatedAt: isStr(raw.updatedAt, 40) ? raw.updatedAt : new Date().toISOString(),
    },
  };
}
