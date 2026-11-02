import type { Curriculum } from "@/types/plan";
import { CS66_CORE_EDGES, CS66_CORE_SLOTS, CS66_INTERN_TRACK, openSlots, t } from "./cs66-common";

// ถอดจากผัง docs/reference/cs66-dependency-honors.png
// (CS-66-course-dependency-09-01-2026, เกียรตินิยม / Honor program) — โครงเดียวกับเอกเดี่ยว-ฝึกงาน
// แต่เพิ่มวิชาเกียรตินิยม และปี 4 เทอม 2 ให้ "Choose at least 1" ระหว่าง 2301592 Indiv II กับ 2301599 CS Research II
// หน่วยกิตหัวคอลัมน์ของภาคนับวิชาเลือกตัวนั้นแค่ 3 หน่วยกิต (14.5) รวมทั้งหลักสูตร 137
export const cs66Honors: Curriculum = {
  id: "cs66-honors",
  title: "CS-66 Honor program",
  source: "CS-66-course-dependency-09-01-2026-เกียรตินิยม.pdf",
  totalCredits: 137,
  termCredits: [
    { term: t(1, 1), credits: 18 },
    { term: t(1, 2), credits: 19 },
    { term: t(2, 1), credits: 18 },
    { term: t(2, 2), credits: 19 },
    { term: t(3, 1), credits: 18 },
    { term: t(3, 2), credits: 17 },
    { term: t(3, "S"), credits: null, note: "ฝึกงาน" },
    { term: t(4, 1), credits: 13.5 },
    { term: t(4, 2), credits: 14.5, note: "เลือก Indiv II หรือ CS Research II อย่างน้อย 1 วิชา" },
  ],
  slots: [
    ...CS66_CORE_SLOTS,
    ...CS66_INTERN_TRACK.slots,
    { id: "2301592", code: "2301592", name: "Indiv II", credits: 3, category: "honors", term: t(4, 2), row: 7, choiceGroup: "honors-y4s2", note: "เลือกอย่างน้อย 1 วิชาระหว่าง 2301592 Indiv II กับ 2301599 CS Research II" },
    { id: "2301488", code: "2301488", name: "Workshop CS", credits: 1, category: "honors", term: t(2, 2), row: 8 },
    { id: "2301591", code: "2301591", name: "Indiv I", credits: 3, category: "honors", term: t(3, 1), row: 8 },
    { id: "2301598", code: "2301598", name: "CS Research I", credits: 3, category: "honors", term: t(3, 2), row: 8 },
    { id: "2301599", code: "2301599", name: "CS Research II", credits: 3, category: "honors", term: t(4, 2), row: 8, choiceGroup: "honors-y4s2", note: "เลือกอย่างน้อย 1 วิชาระหว่าง 2301592 Indiv II กับ 2301599 CS Research II" },
    ...openSlots([
      ["elec-1", "Elective I", "elective", 2, 2, 9],
      ["elec-2", "Elective II", "elective", 3, 1, 9],
      ["elec-3", "Elective III", "elective", 3, 2, 9],
      ["elec-5", "Elective V", "elective", 4, 1, 9],
      ["gen-4", "Gen Ed IV", "gened", 4, 2, 9],
      ["gen-1", "Gen Ed I", "gened", 2, 1, 10],
      ["elec-4", "Elective IV", "elective", 3, 2, 10],
      ["gen-3", "Gen Ed III", "gened", 4, 1, 10],
      ["gen-5", "Gen Ed V", "gened", 4, 2, 10],
      ["gen-2", "Gen Ed II", "gened", 2, 1, 11],
      ["free-1", "Free I", "free", 3, 1, 11],
      ["free-2", "Free II", "free", 4, 1, 11],
      ["gen-6", "Gen Ed VI", "gened", 4, 2, 11],
    ]),
  ],
  edges: [...CS66_CORE_EDGES, ...CS66_INTERN_TRACK.edges],
};
