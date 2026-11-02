import type {
  AcademicTerm,
  Category,
  Curriculum,
  Enrollment,
  Grade,
  PickedCourse,
  PlanTerm,
  Slot,
  Student,
  StudentEdits,
} from "@/types/plan";
import { sameTerm, termIndex, termKey, termLabel, termLabelTh, toAcademic, toPlan } from "./terms";

// แปลง หลักสูตร + ประวัตินิสิต + การแก้จากหน้าเว็บ → โมเดลผังที่วาดได้ทันที
// คำนวณฝั่ง server ทั้งหมด (pure function) ให้ client แค่วาดและจัดการ hover/คลิก

/** ช่องที่ไม่มีรหัสวิชา = ช่องให้นิสิตเอาวิชาจริงมาเติม */
export const isFillable = (slot: Slot) => !slot.code;

/** ความพยายาม "ล่าสุด" ของช่อง — ตก/ถอนเป็นประวัติที่ต้องเก็บไว้นับ GPA ไม่ถูกแทนที่ตอนลงใหม่ */
const isCurrentAttempt = (e: Enrollment) =>
  e.status === "planned" || e.status === "enrolled" || e.status === "passed";

const STATUS_RANK: Record<Enrollment["status"], number> = {
  passed: 4, enrolled: 3, planned: 2, failed: 1, withdrawn: 0,
};

/** record ที่ใช้แสดงบนกล่อง: สถานะที่ "ไปไกลที่สุด" ถ้าเท่ากันเอาเทอมหลังสุด */
function primaryRecord(enrollments: Enrollment[], slotId: string): Enrollment | undefined {
  let best: Enrollment | undefined;
  for (const e of enrollments) {
    if (e.fillsSlot !== slotId) continue;
    if (!best || STATUS_RANK[e.status] > STATUS_RANK[best.status]
      || (STATUS_RANK[e.status] === STATUS_RANK[best.status] && e.term > best.term)) best = e;
  }
  return best;
}

/**
 * ซ้อนการแก้จากหน้าเว็บลงบน student.ts (ค่าตามเอกสาร) — ลำดับ: เติมวิชา แล้วค่อยตั้งสถานะ
 * ไม่แก้ object เดิม คืน Student ใหม่ เพื่อให้คำนวณซ้ำได้และเทียบกับค่าตั้งต้นได้
 */
export function applyEdits(student: Student, edits: StudentEdits, curriculum: Curriculum): Student {
  const slots = new Map(curriculum.slots.map((s) => [s.id, s]));
  let enrollments = [...student.enrollments];

  // 1) เติมวิชาในช่องว่าง: เปลี่ยนแค่ "วิชาไหน" สถานะ/เทอม/เกรดของความพยายามล่าสุดคงไว้
  for (const [slotId, picked] of Object.entries(edits.fills)) {
    const slot = slots.get(slotId);
    if (!slot || !isFillable(slot)) continue;
    const prev = enrollments.find((e) => e.fillsSlot === slotId && isCurrentAttempt(e));
    enrollments = enrollments.filter((e) => !(e.fillsSlot === slotId && isCurrentAttempt(e)));
    if (picked) {
      enrollments.push({
        term: prev?.term ?? toAcademic(slot.registerTerm ?? effectiveTerm(slot, student), student.entryYear),
        code: picked.code,
        name: picked.name,
        credits: picked.credits,
        status: prev?.status ?? "planned",
        ...(prev?.grade && { grade: prev.grade }),
        fillsSlot: slotId,
        // การนับหมวดที่เลือกเองจากเว็บยังไม่ได้ผ่านภาคเสมอ
        slotUnconfirmed: true,
      });
    }
  }

  // 2) สถานะ/เกรด/เทอม: แทนความพยายามล่าสุด และ record ของเทอมเดียวกัน (แก้ตกเป็นผ่านในเทอมเดิม)
  for (const [slotId, edit] of Object.entries(edits.status ?? {})) {
    const slot = slots.get(slotId);
    if (!slot) continue;
    const prev = primaryRecord(enrollments, slotId);
    const code = slot.code ?? prev?.code;
    // ช่องว่างที่ยังไม่ได้เลือกวิชา ไม่มีอะไรให้ตั้งสถานะ
    if (!code) continue;

    enrollments = enrollments.filter(
      (e) => !(e.fillsSlot === slotId && (isCurrentAttempt(e) || e.term === edit.term)),
    );
    if (edit.status === "none") continue;

    const grade = edit.status === "withdrawn" ? "W" : edit.grade;
    enrollments.push({
      term: edit.term,
      code,
      name: prev?.name ?? slot.name,
      credits: prev?.credits ?? slot.credits,
      status: edit.status,
      ...(grade && { grade }),
      fillsSlot: slotId,
      ...(prev?.slotUnconfirmed && { slotUnconfirmed: true }),
    });
    // ไม่ต้องย้ายกล่องเอง: placedTerm() วางกล่องตามเทอมของ record นี้อยู่แล้ว
  }
  return { ...student, enrollments };
}

/** ตำแหน่งตามแผนล่วงหน้า (slotMoves) หรือตามผังของภาค — ยังไม่ดูว่าลงจริงเทอมไหน */
export function effectiveTerm(slot: Slot, student: Student): PlanTerm {
  return student.slotMoves.find((m) => m.slotId === slot.id)?.to ?? slot.term;
}

/**
 * คอลัมน์ที่กล่องอยู่จริง (ใช้ที่นี่ที่เดียวทั้งเว็บ):
 *   1. มี record ผ่าน/กำลังเรียน/วางแผน → เทอมที่ลงจริง (Calc I ถอนเทอม 1 ลงใหม่ผ่านเทอม 2 → อยู่เทอม 2)
 *      ยกเว้นสหกิจ/ฝึกงานที่ลงทะเบียน registerTerm แต่กล่องอยู่ซัมเมอร์ตามผัง
 *   2. ไม่มี record → slotMoves (แผนที่ตั้งใจไว้) หรือตำแหน่งตามผังของภาค
 * ตก/ถอนไม่ย้ายกล่อง เพราะกล่องควรรอที่เทอมที่จะลงใหม่ ส่วนเทอมที่ตก/ถอนแสดงเป็นกล่องจางแทน
 */
export function placedTerm(slot: Slot, student: Student): PlanTerm {
  const e = primaryRecord(student.enrollments, slot.id);
  if (e && isCurrentAttempt(e)) {
    const t = toPlan(e.term, student.entryYear);
    if (t && !(slot.registerTerm && sameTerm(t, slot.registerTerm))) return t;
  }
  return effectiveTerm(slot, student);
}

function effectiveRow(slot: Slot, student: Student): number {
  return student.slotMoves.find((m) => m.slotId === slot.id)?.row ?? slot.row;
}

// ---------- สถิติหัวหน้า ----------

const GRADE_POINT: Partial<Record<Grade, number>> = {
  A: 4, "B+": 3.5, B: 3, "C+": 2.5, C: 2, "D+": 1.5, D: 1, F: 0,
};

/**
 * GPA ของชุดวิชา — นับทุกครั้งที่ลง รวมครั้งที่ตก (F = 0) ตามแบบจุฬาฯ · S/U/W ไม่นับ
 * ปัดเศษ ไม่ใช่ตัดทิ้ง — ใบเกรดปี 1 ได้ 101/32 = 3.156 แสดงเป็น 3.16
 */
export function gpaOf(enrollments: Enrollment[]): { gpa: number; credits: number } | null {
  const graded = enrollments.filter((e) => e.grade && e.grade in GRADE_POINT);
  const credits = graded.reduce((s, e) => s + e.credits, 0);
  if (!credits) return null;
  const points = graded.reduce((s, e) => s + GRADE_POINT[e.grade!]! * e.credits, 0);
  return { gpa: Math.round((points / credits) * 100) / 100, credits };
}

/** GPA รายเทอม + GPAX สะสมถึงเทอมนั้น เรียงตามเวลา (AcademicTerm เรียงแบบสตริงได้: 2568/1 < 2568/2 < 2568/S) */
export function termGpas(student: Student) {
  const terms = [...new Set(student.enrollments.map((e) => e.term))].sort();
  return terms
    .map((term) => ({
      term,
      gpa: gpaOf(student.enrollments.filter((e) => e.term === term)),
      gpax: gpaOf(student.enrollments.filter((e) => e.term <= term)),
    }))
    .filter((t) => t.gpa);
}

/**
 * ความคืบหน้ารายชั้นปี: หน่วยกิตที่ผังของภาคกำหนดในปีนั้น เทียบกับหน่วยกิตที่ผ่านแล้วของวิชาในช่องของปีนั้น
 * นับตามช่องในผัง (ไม่ใช่ปีที่ลงจริง) — ลง Calc II ช้าไปปี 2 ก็ยังนับเป็นของปี 1 ตามผัง ปีไหนยังขาดจะเห็นชัด
 */
export function yearProgress(curriculum: Curriculum, student: Student) {
  return ([1, 2, 3, 4] as const).map((year) => {
    const slots = curriculum.slots.filter((s) => s.term.year === year);
    const passedIn = (id: string) =>
      student.enrollments.find((e) => e.fillsSlot === id && e.status === "passed" && e.grade !== "U")?.credits ?? 0;
    // กลุ่มเลือกอย่างน้อย 1 นับหน่วยกิตครั้งเดียว และนับที่ผ่านได้แค่เท่าที่กลุ่มต้องการ
    const groups = new Map<string, Slot[]>();
    let required = 0;
    let earned = 0;
    for (const s of slots) {
      if (s.choiceGroup) groups.set(s.choiceGroup, [...(groups.get(s.choiceGroup) ?? []), s]);
      else {
        required += s.credits;
        earned += passedIn(s.id);
      }
    }
    for (const g of groups.values()) {
      const need = Math.max(...g.map((s) => s.credits));
      required += need;
      earned += Math.min(need, g.reduce((sum, s) => sum + passedIn(s.id), 0));
    }
    return { year, required, earned: Math.min(earned, required) };
  });
}

export function summarize(student: Student) {
  // S ได้หน่วยกิตแต่ไม่นับ GPA · W/F/U ไม่ได้หน่วยกิต
  const earned = student.enrollments
    .filter((e) => e.status === "passed" && e.grade !== "W" && e.grade !== "F" && e.grade !== "U")
    .reduce((s, e) => s + e.credits, 0);
  const gpas = termGpas(student);
  return {
    earned,
    gpax: gpaOf(student.enrollments)?.gpa ?? null,
    lastGradedTerm: gpas.at(-1)?.term ?? null,
  };
}

// ---------- โมเดลผัง ----------

export type NodeStatus = "passed" | "enrolled" | "planned" | "failed" | "withdrawn" | "behind" | "none";

export type ChartColumn = {
  key: string;
  term: PlanTerm;
  academic: AcademicTerm;
  label: string;
  credits: string;
  /** "GPA 3.03 · GPAX 3.03" — null = เทอมนี้ยังไม่มีเกรด */
  gpa: string | null;
  isNow: boolean;
};

export type ChartNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  col: number;
  row: number;
  category: Category;
  status: NodeStatus;
  badge: string | null;
  /** บรรทัดบน (ตัวหนา) และบรรทัดล่าง — ช่องว่างที่ยังไม่เติมมีบรรทัดเดียว */
  line1: string;
  line2: string | null;
  /** ข้อความเต็มสำหรับ tooltip/screen reader */
  title: string;
  ghost: boolean;
  note: string | null;
  /** ข้อมูลสำหรับแผงแก้ช่อง (null = กล่องจางที่บอกว่าย้ายไปไหน กดไม่ได้) */
  info: SlotInfo | null;
};

export type SlotInfo = {
  slotId: string;
  slotName: string;
  /** รหัสตามผังของภาค · null = ช่องว่างให้เติมวิชาเอง */
  code: string | null;
  category: Category;
  credits: number;
  /** เทอมตามผังของภาค และเทอมที่กล่องอยู่ตอนนี้ */
  curriculumTermLabel: string;
  termLabel: string;
  academic: AcademicTerm;
  current:
    | (PickedCourse & { status: Enrollment["status"]; grade: Grade | null; term: AcademicTerm; unconfirmed: boolean })
    | null;
  /** มีค่าที่แก้จากเว็บค้างอยู่ (ไว้โชว์ปุ่มคืนค่าเดิม) */
  edited: { fill: boolean; status: boolean };
  /** base (แผนตั้งต้น/ไฟล์ที่นำเข้า) มี record ของช่องนี้ — ปุ่มคืนค่าเดิมจะกลับไปที่ค่านั้น */
  fromBase: boolean;
};

/** ข้อมูลประกอบจากหน้า page ที่ buildChart รู้เองไม่ได้ (เทียบกับค่าก่อนแก้) */
export type ChartMeta = {
  edits: StudentEdits;
  base: Student;
};

export type ChartEdge = { d: string; from: string; to: string; coreq: boolean };

export type ChartModel = {
  width: number;
  height: number;
  columns: ChartColumn[];
  nodes: ChartNode[];
  edges: ChartEdge[];
  corner: { x: number; total: string; title: string };
  /** แถบพื้นหลังสีประจำชั้นปี ครอบคอลัมน์ทุกเทอมของปีนั้น (รวมซัมเมอร์) */
  years: { year: 1 | 2 | 3 | 4; x: number; w: number }[];
  /** รหัสวิชาที่อยู่ในแผนแล้ว (ไม่นับที่ตก/ถอน) กันเลือกวิชาซ้ำ → slotId ที่ใช้อยู่ */
  usedCodes: Record<string, string>;
  /** เทอมทั้งหมดตลอด 4 ปี ให้เลือกในแผงแก้สถานะ */
  termOptions: { value: AcademicTerm; label: string }[];
};

// กล่องขนาดเดียวกับต้นแบบ แต่ร่องกว้างขึ้น (คอลัมน์ 48px แถว 42px) ให้เส้นมีเลนแยกกันและไม่เฉียดขอบกล่อง/ป้ายสถานะ
// Y0 เผื่อหัวคอลัมน์ 4 บรรทัด: หน่วยกิต / ชื่อเทอม / GPA / "ตอนนี้"
export const GEOM = { PITCH: 176, W: 128, H: 50, RH: 92, X0: 24, Y0: 136 } as const;

/** ชื่อย่อของช่องว่าง ไว้ต่อท้ายชื่อวิชาที่เติม เช่น "Elec I · Req Eng" */
const shortSlot = (name: string) =>
  name.replace("Elective", "Elec").replace("Gen Ed", "GE");

const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s);

export function buildChart(curriculum: Curriculum, student: Student, meta?: ChartMeta): ChartModel {
  const { PITCH, W, RH, X0, Y0 } = GEOM;

  // คอลัมน์ = เทอมในผังของภาค + เทอมที่นิสิตย้ายช่องไป + ซัมเมอร์ปี 2 ไว้รับวิชาค้างเสมอ
  const terms = new Map<string, PlanTerm>();
  for (const t of curriculum.termCredits) terms.set(termKey(t.term), t.term);
  for (const m of student.slotMoves) terms.set(termKey(m.to), m.to);
  // เทอมที่ลงจริงนอกผัง (เช่นลงซัมเมอร์ปี 1) ต้องมีคอลัมน์ให้กล่องและกล่องจางของประวัติ
  for (const e of student.enrollments) {
    const t = e.fillsSlot ? toPlan(e.term, student.entryYear) : null;
    if (t) terms.set(termKey(t), t);
  }
  terms.set("2-S", { year: 2, sem: "S" });
  const colTerms = [...terms.values()].sort((a, b) => termIndex(a) - termIndex(b));
  const colOf = (t: PlanTerm) => colTerms.findIndex((c) => sameTerm(c, t));

  // "ตอนนี้" = เทอมที่มีวิชากำลังเรียน — ใช้ข้อมูลแทนวันที่ เพื่อให้ผลเหมือนเดิมทุกครั้งที่ render
  const nowAcademic = student.enrollments.filter((e) => e.status === "enrolled").map((e) => e.term).sort().at(-1);
  const nowTerm = nowAcademic ? toPlan(nowAcademic, student.entryYear) : null;

  const gpaByTerm = new Map(termGpas(student).map((g) => [g.term, g]));

  const columns: ChartColumn[] = colTerms.map((t) => {
    const academic = toAcademic(t, student.entryYear);
    const g = gpaByTerm.get(academic);
    const planned = curriculum.termCredits.find((c) => sameTerm(c.term, t))?.credits ?? null;
    const inTerm = student.enrollments.filter((e) => e.term === academic && e.status !== "withdrawn");
    const sum = inTerm.reduce((s, e) => s + e.credits, 0);
    let actual = "";
    if (inTerm.length) {
      const verb = inTerm.every((e) => e.status === "passed" || e.status === "failed")
        ? "ได้จริง"
        : inTerm.some((e) => e.status === "enrolled") ? "ลงอยู่" : "วางแผน";
      // นับเฉพาะที่ได้หน่วยกิตจริงเมื่อเทอมจบแล้ว
      const shown = verb === "ได้จริง" ? inTerm.filter((e) => e.status === "passed").reduce((s, e) => s + e.credits, 0) : sum;
      actual = `${verb} ${shown}`;
    }
    // เทอมที่ผังของภาคไม่ได้กำหนด (เช่นซัมเมอร์ปี 2) บอกหน่วยกิตของช่องที่ย้ายมาแทน
    const moved = student.slotMoves
      .filter((m) => sameTerm(m.to, t))
      .reduce((sum, m) => sum + (curriculum.slots.find((s) => s.id === m.slotId)?.credits ?? 0), 0);
    const base = planned != null ? `${planned} credits` : moved && !inTerm.length ? `ย้ายมา ${moved}` : null;
    const credits = [base, actual || null].filter(Boolean).join(" · ");
    return {
      key: termKey(t),
      term: t,
      academic,
      label: termLabel(t),
      credits,
      gpa: g ? `GPA ${g.gpa!.gpa.toFixed(2)} · GPAX ${g.gpax!.gpa.toFixed(2)}` : null,
      isNow: !!nowTerm && sameTerm(nowTerm, t),
    };
  });

  const usedCodes: Record<string, string> = {};
  for (const e of student.enrollments) {
    if (e.fillsSlot && e.status !== "failed" && e.status !== "withdrawn") usedCodes[e.code] = e.fillsSlot;
  }

  // วางกล่อง: ช่องที่อยู่ตำแหน่งตามผังวางก่อน ช่องที่ถูกย้ายวางทีหลัง ถ้าชนกล่องอื่นเลื่อนหาแถวว่างที่ใกล้ที่สุด
  // (ย้ายเทอมจากหน้าเว็บไม่ได้บอกแถว และ slotMoves ใน student.ts ก็อาจชนกันได้ถ้าแก้มือ)
  const occupied = new Set<string>();
  const cells = (col: number, row: number, span = 1) => Array.from({ length: span }, (_, i) => `${col + i}:${row}`);
  const free = (col: number, row: number, span?: number) => cells(col, row, span).every((c) => !occupied.has(c));
  const placed = new Map<string, { col: number; row: number }>();
  const termOf = new Map(curriculum.slots.map((s) => [s.id, placedTerm(s, student)]));
  const moved = (s: Slot) => !sameTerm(termOf.get(s.id)!, s.term);
  for (const slot of [...curriculum.slots].sort((a, b) => Number(moved(a)) - Number(moved(b)))) {
    const col = colOf(termOf.get(slot.id)!);
    const want = effectiveRow(slot, student);
    let row = want;
    for (let d = 1; !free(col, row, slot.span) && d < 40; d++) {
      // ลองล่างก่อนบน เพราะแถวล่างของผังเป็นช่องว่าง (วิชาเลือก/Gen Ed) ที่มักว่างกว่า
      row = want + d;
      if (free(col, row, slot.span)) break;
      if (want - d >= 0) row = want - d;
    }
    cells(col, row, slot.span).forEach((c) => occupied.add(c));
    placed.set(slot.id, { col, row });
  }

  const baseHas = (slotId: string) => !!meta?.base.enrollments.some((e) => e.fillsSlot === slotId);

  const nodes: ChartNode[] = [];
  for (const slot of curriculum.slots) {
    const term = termOf.get(slot.id)!;
    const { col, row } = placed.get(slot.id)!;
    const w = slot.span ? W + PITCH * (slot.span - 1) : W;
    const e = primaryRecord(student.enrollments, slot.id);

    // ค้าง = เลยเทอมที่ผังของภาคกำหนดมาแล้วแต่ยังไม่ผ่าน/ไม่ได้ลง (ตก/ถอนแสดงสถานะของมันเองอยู่แล้ว)
    const overdue = !e && !!nowTerm && termIndex(slot.term) < termIndex(nowTerm);
    const status: NodeStatus = e ? e.status : overdue ? "behind" : "none";

    const badge =
      status === "passed" ? `✓ ${e!.grade ?? ""}`.trim()
      : status === "enrolled" ? "เรียนอยู่"
      : status === "planned" ? e!.term
      : status === "failed" ? `ตก ${e!.grade ?? ""}`.trim()
      : status === "withdrawn" ? `ถอน ${e!.term}`
      : status === "behind" ? "ค้าง"
      : null;

    let line1: string, line2: string | null, title: string;
    if (slot.code) {
      line1 = `${slot.code} (${slot.credits})`;
      line2 = slot.name;
      title = `${slot.code} ${slot.name}`;
    } else if (e) {
      line1 = `${e.code} (${e.credits})`;
      line2 = clip(`${shortSlot(slot.name)} · ${e.name}`, 19);
      title = `${slot.name}: ${e.code} ${e.name}${e.slotUnconfirmed ? " (การนับหมวดยังไม่ยืนยันกับภาค)" : ""}`;
    } else {
      line1 = `${slot.name} (${slot.credits})`;
      line2 = null;
      title = `${slot.name} ยังไม่ได้เลือกวิชา`;
    }

    nodes.push({
      id: slot.id,
      x: X0 + col * PITCH,
      y: Y0 + row * RH,
      w,
      col,
      row,
      category: slot.category,
      status,
      badge,
      line1,
      line2,
      title,
      ghost: false,
      note: slot.note && slot.span ? slot.note : null,
      info: {
        slotId: slot.id,
        slotName: slot.name,
        code: slot.code ?? null,
        category: slot.category,
        credits: slot.credits,
        curriculumTermLabel: termLabelTh(slot.term),
        termLabel: termLabelTh(term),
        // ค่าเริ่มต้นของฟอร์ม: สหกิจ/ฝึกงานลงทะเบียน registerTerm ไม่ใช่เทอมที่กล่องอยู่
        academic: toAcademic(slot.registerTerm ?? term, student.entryYear),
        current: e
          ? {
              code: e.code,
              name: e.name,
              credits: e.credits,
              status: e.status,
              grade: e.grade ?? null,
              term: e.term,
              unconfirmed: !!e.slotUnconfirmed,
            }
          : null,
        edited: {
          fill: !!meta && slot.id in meta.edits.fills,
          status: !!meta && slot.id in meta.edits.status,
        },
        fromBase: baseHas(slot.id),
      },
    });

    // กล่องจางของประวัติ: เทอมที่เคยถอน/ตกวิชานี้ (เช่น Calc I ถอน W ปี 1 เทอม 1 แล้วไปผ่านเทอม 2)
    // วางที่แถวของกล่อง ถ้าช่องนั้นมีกล่องอื่นอยู่ก็ข้าม — ข้อมูลยังอยู่ในแผงของกล่องและนับ GPA ครบ
    for (const h of student.enrollments) {
      if (h.fillsSlot !== slot.id || (h.status !== "failed" && h.status !== "withdrawn") || h === e) continue;
      const ht = toPlan(h.term, student.entryYear);
      const hc = ht ? colOf(ht) : -1;
      if (hc < 0 || hc === col || !free(hc, row)) continue;
      occupied.add(`${hc}:${row}`);
      const what = h.status === "withdrawn" ? "ถอน (W)" : `ตก ${h.grade ?? ""}`.trim();
      nodes.push({
        id: `${slot.id}~${h.term}`,
        x: X0 + hc * PITCH, y: Y0 + row * RH, w: W, col: hc, row,
        category: slot.category, status: h.status,
        badge: h.status === "withdrawn" ? "W" : (h.grade ?? "F"),
        line1: `${h.code} (${h.credits})`,
        line2: `${what} ${h.term}`,
        title: `${h.code} ${h.name} ${what} เทอม ${h.term}`,
        ghost: true, note: null, info: null,
      });
    }

    // กล่องจางที่ตำแหน่งเดิม บอกว่าวิชาค้างถูกย้ายไปไหน — วางเฉพาะเมื่อช่องนั้นยังว่าง
    if (overdue && !sameTerm(term, slot.term)) {
      const gc = colOf(slot.term);
      if (gc >= 0 && free(gc, slot.row)) {
        occupied.add(`${gc}:${slot.row}`);
        nodes.push({
          id: `${slot.id}~ghost`,
          x: X0 + gc * PITCH, y: Y0 + slot.row * RH, w: W, col: gc, row: slot.row,
          category: slot.category, status: "none", badge: null,
          line1: slot.code ? `${slot.code} (${slot.credits})` : slot.name,
          line2: `ย้ายไป ${termLabelTh(term)}`,
          title: `${slot.name} ย้ายไป ${termLabelTh(term)}`,
          ghost: true, note: null, info: null,
        });
      }
    }
  }

  const edges = routeEdges(nodes, curriculum.edges);

  const maxRow = Math.max(...nodes.map((n) => n.row));
  const y4s1 = colOf({ year: 4, sem: 1 });
  return {
    width: X0 * 2 + PITCH * (columns.length - 1) + W,
    height: Y0 + RH * (maxRow + 1) + 28,
    columns,
    nodes,
    edges,
    years: ([1, 2, 3, 4] as const).flatMap((year) => {
      const cols = columns.map((c, i) => (c.term.year === year ? i : -1)).filter((i) => i >= 0);
      if (!cols.length) return [];
      // ยื่นออกข้างละ 12px ให้กล่องไม่ชิดขอบแถบ แต่ยังเหลือช่องว่างระหว่างปีให้แยกกันออก
      const x = X0 + cols[0] * PITCH - 12;
      return [{ year, x, w: (cols.at(-1)! - cols[0]) * PITCH + W + 24 }];
    }),
    corner: {
      x: X0 + (y4s1 >= 0 ? y4s1 : columns.length - 2) * PITCH + W / 2,
      total: `Total ${curriculum.totalCredits} credits`,
      title: curriculum.title.replace(/^CS-\d+\s*/, ""),
    },
    usedCodes,
    termOptions: ([1, 2, 3, 4] as const).flatMap((year) =>
      ([1, 2, "S"] as const).map((sem) => ({
        value: toAcademic({ year, sem }, student.entryYear),
        label: termLabelTh({ year, sem }),
      })),
    ),
  };
}

// ---------- ลูกศร ----------
// เส้นเดินในร่องเท่านั้น จึงไม่ผ่านกล่อง: ออกขอบขวาต้นทาง → ลงร่องระหว่างคอลัมน์ (ลำต้น)
// → วิ่งตามร่องระหว่างแถว → เข้าขอบบน/ล่างของปลายทาง
// กันเส้นทับกันสามชั้น:
//   1. เส้นจากต้นทางเดียวกันใช้ลำต้นและแนวนอนร่วมกันแบบ bus (เส้นเดียวแตกกิ่ง ไม่ใช่ห้าเส้นขนานกัน)
//   2. bus ต่างต้นทางที่ช่วงทับกันในร่องเดียวกันได้คนละเลน (interval scheduling) ช่วงไม่ทับกันใช้เลนเดียวกันได้
//   3. หลายเส้นเข้ากล่องเดียวกันฝั่งเดียวกัน กระจายจุดเข้าตามลำดับต้นทางซ้าย→ขวา หัวลูกศรจะไม่ซ้อน

const LANE = 5;
const MAX_LANES = 5;
const LANE_OFFSETS = [0, -LANE, LANE, -2 * LANE, 2 * LANE];
/** ป้ายสถานะยื่นจากขอบบนกล่องขึ้นไป 10px — ห้ามมีเส้นแนวนอนในโซนนี้ */
const BADGE_ZONE = 14;
/** ระยะห่างขั้นต่ำจากขอบล่างกล่องแถวบน */
const EDGE_PAD = 8;
/** รัศมีมุมโค้ง — มุมฉากล้วนตอนเส้นเยอะดูแข็งและแยกเส้นยาก */
const CORNER = 6;

type Interval = { key: string; channel: string; lo: number; hi: number };

/** ให้เลนกับแต่ละช่วงในช่องเดียวกัน — ช่วงที่ทับกันห้ามอยู่เลนเดียวกัน */
function assignLanes(items: Interval[]): Map<string, number> {
  const out = new Map<string, number>();
  const byChannel = new Map<string, Interval[]>();
  for (const it of items) byChannel.set(it.channel, [...(byChannel.get(it.channel) ?? []), it]);
  for (const list of byChannel.values()) {
    // ช่วงยาวก่อน ให้เส้นหลักได้เลนกลาง (เลน 0) ซึ่งอ่านง่ายที่สุด
    list.sort((p, q) => q.hi - q.lo - (p.hi - p.lo) || p.lo - q.lo);
    const lanes: Interval[][] = [];
    for (const it of list) {
      let lane = lanes.findIndex((used) => used.every((u) => it.hi + 4 < u.lo || it.lo > u.hi + 4));
      if (lane < 0) {
        lane = lanes.length;
        lanes.push([]);
      }
      lanes[lane].push(it);
      // เกินจำนวนเลนที่ร่องรับไหว ยอมให้วนซ้ำดีกว่าล้นไปทับกล่อง
      out.set(it.key, lane % MAX_LANES);
    }
  }
  return out;
}

/** เส้นหักฉากผ่านจุดที่ให้ แต่ปัดมุมเป็นโค้งเล็กๆ (ตัดจุดซ้ำ/จุดที่อยู่แนวเดียวกันทิ้งก่อน) */
function roundedPath(points: [number, number][]): string {
  const pts = points.filter((p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const inLen = Math.hypot(x - px, y - py);
    const outLen = Math.hypot(nx - x, ny - y);
    const r = Math.min(CORNER, inLen / 2, outLen / 2);
    const ax = x - ((x - px) / inLen) * r, ay = y - ((y - py) / inLen) * r;
    const bx = x + ((nx - x) / outLen) * r, by = y + ((ny - y) / outLen) * r;
    d += ` L${ax} ${ay} Q${x} ${y} ${bx} ${by}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

function routeEdges(nodes: ChartNode[], defs: Curriculum["edges"]): ChartEdge[] {
  const { PITCH, W, H, RH, X0, Y0 } = GEOM;
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const blocked = (row: number, c1: number, c2: number) =>
    nodes.some((n) => n.row === row && n.col > Math.min(c1, c2) && n.col < Math.max(c1, c2));
  // ร่องแถว k = ระหว่างแถว k-1 กับแถว k · ใช้ได้เฉพาะแถบกลาง เว้นขอบล่างกล่องบนและโซนป้ายของกล่องล่าง
  const gapBand = (k: number) => {
    const top = k === 0 ? Y0 - 26 : Y0 + (k - 1) * RH + H + EDGE_PAD;
    const bottom = Y0 + k * RH - BADGE_ZONE;
    return { top, bottom, center: (top + bottom) / 2 };
  };
  const gapCenter = (k: number) => gapBand(k).center;
  const gutterLeft = (col: number) => X0 + col * PITCH + W;

  type Routed = { from: ChartNode; to: ChartNode; coreq: boolean; gap: number; top: boolean; ex: number };
  const direct: ChartEdge[] = [];
  const routed: Routed[] = [];

  for (const e of defs) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) continue;
    const coreq = e.kind === "coreq";
    if (a.col === b.col) {
      const x = a.x + a.w / 2;
      direct.push({ from: e.from, to: e.to, coreq, d: `M${x} ${a.y + H} V${b.y}` });
    } else if (a.row === b.row && !blocked(a.row, a.col, b.col)) {
      const y = a.y + H / 2;
      direct.push({ from: e.from, to: e.to, coreq, d: `M${a.x + a.w} ${y} H${b.x}` });
    } else {
      const top = b.row >= a.row;
      routed.push({ from: a, to: b, coreq, gap: top ? b.row : b.row + 1, top, ex: 0 });
    }
  }

  // จุดเข้าปลายทาง: เรียงตามคอลัมน์/แถวต้นทาง เส้นจากซ้ายเข้าทางซ้าย ลดการไขว้กันตรงหัวลูกศร
  const arrivals = new Map<string, Routed[]>();
  for (const r of routed) {
    const k = `${r.to.id}|${r.top}`;
    arrivals.set(k, [...(arrivals.get(k) ?? []), r]);
  }
  for (const list of arrivals.values()) {
    list.sort((p, q) => p.from.col - q.from.col || p.from.row - q.from.row);
    // เข้าทางขอบบน: ป้ายสถานะอยู่ครึ่งขวาของขอบบน จึงให้หัวลูกศรลงครึ่งซ้าย · ขอบล่างไม่มีป้าย ลงกลางได้
    const anchor = list[0].top ? list[0].to.x + 40 : list[0].to.x + list[0].to.w / 2;
    const spread = 14;
    list.forEach((r, i) => {
      r.ex = anchor + (i - (list.length - 1) / 2) * spread;
    });
  }

  // ลำต้นในร่องคอลัมน์: หนึ่งเส้นต่อหนึ่งต้นทาง ครอบช่วงสูงของทุกกิ่ง
  const trunks: Interval[] = [];
  const bySource = new Map<string, Routed[]>();
  for (const r of routed) bySource.set(r.from.id, [...(bySource.get(r.from.id) ?? []), r]);
  for (const [id, list] of bySource) {
    const a = list[0].from;
    const ys = [a.y + H / 2, ...list.map((r) => gapCenter(r.gap))];
    trunks.push({ key: id, channel: `c${a.col}`, lo: Math.min(...ys), hi: Math.max(...ys) });
  }
  const trunkLane = assignLanes(trunks);
  const trunkX = (a: ChartNode) => gutterLeft(a.col) + 12 + (trunkLane.get(a.id) ?? 0) * (LANE + 1);

  // แนวนอนในร่องแถว: หนึ่งเส้นต่อ (ต้นทาง, ร่อง) ครอบจากลำต้นถึงจุดเข้าที่ไกลที่สุด
  const runs: Interval[] = [];
  const byRun = new Map<string, Routed[]>();
  for (const r of routed) {
    const k = `${r.from.id}|${r.gap}`;
    byRun.set(k, [...(byRun.get(k) ?? []), r]);
  }
  for (const [k, list] of byRun) {
    const xs = [trunkX(list[0].from), ...list.map((r) => r.ex)];
    runs.push({ key: k, channel: `g${list[0].gap}`, lo: Math.min(...xs), hi: Math.max(...xs) });
  }
  const runLane = assignLanes(runs);

  const paths: ChartEdge[] = routed.map((r) => {
    const a = r.from;
    const tx = trunkX(a);
    const band = gapBand(r.gap);
    const gy = Math.min(band.bottom, Math.max(band.top, band.center + LANE_OFFSETS[runLane.get(`${a.id}|${r.gap}`) ?? 0]));
    const end = r.top ? r.to.y : r.to.y + H;
    const sy = a.y + H / 2;
    return {
      from: a.id,
      to: r.to.id,
      coreq: r.coreq,
      d: roundedPath([[a.x + a.w, sy], [tx, sy], [tx, gy], [r.ex, gy], [r.ex, end]]),
    };
  });

  return [...direct, ...paths];
}
