// โมเดลข้อมูลของแผนการเรียน แยก "หลักสูตร" (ผังของภาค ใช้ร่วมกันทุกคนในรุ่น)
// ออกจาก "ประวัติของนิสิต" (เกรด/วิชาที่ลง) เพื่อให้เปลี่ยนหลักสูตรหรือคนได้โดยไม่แตะอีกฝั่ง

/** หมวดวิชา ตรงกับสีในผัง CS-66 ของภาค */
export type Category =
  | "core" // วิชาเอกบังคับ (กล่องขาว)
  | "sci" // วิทย์พื้นฐาน (เหลือง)
  | "eng" // ภาษาอังกฤษ (ฟ้า)
  | "elective" // วิชาเลือกเอก (ส้ม)
  | "gened" // ศึกษาทั่วไป (เขียว)
  | "free" // เลือกเสรี (ม่วง)
  | "coop" // สหกิจ / ฝึกงาน / CS Project (เทาฟ้า)
  | "minor" // วิชาโท — แผนเอก-โท (แดงชมพู)
  | "honors"; // วิชาเฉพาะแผนเกียรตินิยม (แดงชมพู สีเดียวกับวิชาโทตามผังของภาค)

/** เทอมในผัง นับตามชั้นปี ไม่ใช่ปีการศึกษา — "S" คือภาคฤดูร้อน */
export type PlanTerm = { year: 1 | 2 | 3 | 4; sem: 1 | 2 | "S" };

/** ช่องในผังหลักสูตร — วิชาเลือก/Gen Ed เป็นช่องว่างที่ไม่มีรหัส นิสิตเอาวิชาจริงมาเติม */
export type Slot = {
  id: string;
  code?: string;
  name: string;
  credits: number;
  category: Category;
  term: PlanTerm;
  /** แถวในผัง ใช้จัดตำแหน่งให้เหมือนผังต้นฉบับ (0 = บนสุด) */
  row: number;
  /** กินกี่คอลัมน์ (สหกิจกินซัมเมอร์ปี 3 + ปี 4 เทอม 1) */
  span?: number;
  note?: string;
  /**
   * เทอมที่ลงทะเบียนจริง ถ้าต่างจากตำแหน่งกล่อง (สหกิจ/ฝึกงานไปช่วงซัมเมอร์ปี 3 แต่ลงทะเบียนปี 4 เทอม 1)
   * record ของเทอมนี้จึงไม่ทำให้กล่องย้ายคอลัมน์
   */
  registerTerm?: PlanTerm;
  /** ช่องในกลุ่มเดียวกันเลือกเรียนอย่างน้อย 1 (เช่น Indiv II / CS Research II ของเกียรตินิยม) — นับหน่วยกิตกลุ่มละครั้ง */
  choiceGroup?: string;
};

export type Edge = { from: string; to: string; kind: "prereq" | "coreq" };

export type Curriculum = {
  id: string;
  title: string;
  source: string;
  totalCredits: number;
  /** หน่วยกิตต่อเทอมตามผังของภาค ใช้แสดงหัวคอลัมน์ */
  termCredits: { term: PlanTerm; credits: number | null; note?: string }[];
  slots: Slot[];
  edges: Edge[];
};

export type Grade = "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F" | "S" | "U" | "W" | "I";

/** ปีการศึกษาจริง เช่น "2569/1", "2569/S" */
export type AcademicTerm = `${number}/${1 | 2 | "S"}`;

export type Enrollment = {
  term: AcademicTerm;
  code: string;
  name: string;
  credits: number;
  status: "passed" | "failed" | "withdrawn" | "enrolled" | "planned";
  grade?: Grade;
  /** วิชานี้ไปเติมช่องไหนในผัง (เช่น 2301251 → elective I) — ไม่ใส่ = ยังไม่รู้ว่านับหมวดไหน */
  fillsSlot?: string;
  /** true = การจัดหมวดนี้เดาเอง ยังไม่ได้ยืนยันกับภาค */
  slotUnconfirmed?: boolean;
};

/** วิชาที่เลือกจากหน้าเว็บมาเติมช่อง — เก็บแค่ที่จำเป็นต่อการวาดผังและนับหน่วยกิต */
export type PickedCourse = {
  code: string;
  name: string;
  credits: number;
  /** ประเภท Gen Ed จาก CuGetReg (SO/HU/SC/IN) — NO หรือไม่มี = ไม่ใช่ Gen Ed */
  genEdType?: GenEdType;
};

export type GenEdType = "SO" | "HU" | "SC" | "IN" | "NO";

/** สถานะที่ตั้งจากหน้าเว็บ — "none" = ยังไม่ได้ลง (ลบความพยายามล่าสุดของช่องนั้นออก) */
export type StatusEdit = {
  status: Enrollment["status"] | "none";
  /** passed: A–D หรือ S · failed: F หรือ U · withdrawn ได้ W อัตโนมัติ */
  grade?: Grade;
  term: AcademicTerm;
};

/**
 * การแก้แผนจากหน้าเว็บ เก็บแยกจาก student.ts (ซึ่งถอดจากเอกสารจริง) เพื่อไม่ให้ไฟล์ที่มีคอมเมนต์อธิบายถูกเขียนทับ
 * และกด "คืนค่าเดิม" กลับไปเป็นค่าตามเอกสารได้เสมอ — key ทุกอันคือ Slot.id
 */
export type StudentEdits = {
  /** วิชาที่เติมช่องว่าง · null = ล้างวิชาที่ student.ts ใส่ไว้ */
  fills: Record<string, PickedCourse | null>;
  /** สถานะ/เกรด/เทอมของช่อง ทับค่าใน student.ts */
  status: Record<string, StatusEdit>;
};

/**
 * แผนของนิสิตหนึ่งคน เก็บในเบราว์เซอร์ของคนนั้น (localStorage) และเป็นรูปแบบไฟล์ส่งออก/นำเข้า .json
 * base = ค่าตั้งต้น (แผนว่างตาม template หรือข้อมูลที่นำเข้ามา) · edits = ที่แก้จากหน้าเว็บ ซ้อนทับ base
 * แยกสองชั้นไว้เพื่อให้ปุ่ม "คืนค่าเดิม" กลับไปที่ base ได้
 */
export type PlanDoc = {
  version: 1;
  base: Student;
  edits: StudentEdits;
  updatedAt: string;
};

export type Student = {
  /** ปีการศึกษาที่เข้า ใช้แปลง AcademicTerm ↔ PlanTerm (ปี 1 = entryYear) */
  entryYear: number;
  curriculumId: string;
  enrollments: Enrollment[];
  /** ช่องที่ตั้งใจย้ายไปเทอมอื่นต่างจากผังของภาค */
  slotMoves: { slotId: string; to: PlanTerm; row?: number; reason: string }[];
};
