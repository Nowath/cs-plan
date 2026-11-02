import type { Curriculum } from "@/types/plan";
import { CS66_CORE_EDGES, CS66_CORE_SLOTS, CS66_INTERN_TRACK, openSlots, t } from "./cs66-common";

// ถอดจากผัง docs/reference/cs66-dependency-single-intern.png
// (CS-66-course-dependency-09-01-2026, เอกเดี่ยว-ฝึกงาน)
export const cs66SingleIntern: Curriculum = {
  id: "cs66-single-intern",
  title: "CS-66 Single major / Intern",
  source: "CS-66-course-dependency-09-01-2026-เอกเดี่ยว-ฝึกงาน.pdf",
  totalCredits: 136,
  termCredits: [
    { term: t(1, 1), credits: 18 },
    { term: t(1, 2), credits: 19 },
    { term: t(2, 1), credits: 18 },
    { term: t(2, 2), credits: 18 },
    { term: t(3, 1), credits: 18 },
    { term: t(3, 2), credits: 17 },
    { term: t(3, "S"), credits: null, note: "ฝึกงาน" },
    { term: t(4, 1), credits: 13.5 },
    { term: t(4, 2), credits: 14.5 },
  ],
  slots: [
    ...CS66_CORE_SLOTS,
    ...CS66_INTERN_TRACK.slots,
    ...openSlots([
      ["elec-1", "Elective I", "elective", 2, 2, 8],
      ["elec-2", "Elective II", "elective", 3, 1, 8],
      ["elec-4", "Elective IV", "elective", 3, 2, 8],
      ["elec-6", "Elective VI", "elective", 4, 1, 8],
      ["elec-7", "Elective VII", "elective", 4, 2, 8],
      ["elec-3", "Elective III", "elective", 3, 1, 9],
      ["elec-5", "Elective V", "elective", 3, 2, 9],
      ["elec-8", "Elective VIII", "elective", 4, 2, 9],
      ["gen-1", "Gen Ed I", "gened", 2, 1, 10],
      ["gen-3", "Gen Ed III", "gened", 3, 2, 10],
      ["gen-4", "Gen Ed IV", "gened", 4, 1, 10],
      ["gen-5", "Gen Ed V", "gened", 4, 2, 10],
      ["gen-2", "Gen Ed II", "gened", 2, 1, 11],
      ["free-1", "Free I", "free", 3, 1, 11],
      ["free-2", "Free II", "free", 4, 1, 11],
      ["gen-6", "Gen Ed VI", "gened", 4, 2, 11],
    ]),
  ],
  edges: [...CS66_CORE_EDGES, ...CS66_INTERN_TRACK.edges],
};
