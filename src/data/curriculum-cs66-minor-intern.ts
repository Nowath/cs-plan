import type { Curriculum } from "@/types/plan";
import { CS66_CORE_EDGES, CS66_CORE_SLOTS, CS66_INTERN_TRACK, openSlots, t } from "./cs66-common";

// ถอดจากผัง docs/reference/cs66-dependency-minor-intern.png
// (CS-66-course-dependency-09-01-2026, เอกโท-ฝึกงาน) — ผังเขียน "Total >= 136 credits"
export const cs66MinorIntern: Curriculum = {
  id: "cs66-minor-intern",
  title: "CS-66 Major/Minor Intern",
  source: "CS-66-course-dependency-09-01-2026-เอกโท-ฝึกงาน.pdf",
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
      ["minor-1", "Minor I", "minor", 2, 1, 8],
      ["minor-2", "Minor II", "minor", 2, 2, 8],
      ["minor-3", "Minor III", "minor", 3, 1, 8],
      ["minor-4", "Minor IV", "minor", 3, 2, 8],
      ["minor-5", "Minor V", "minor", 4, 1, 8],
      ["elec-3", "Elective III", "elective", 4, 2, 8],
      ["elec-1", "Elective I", "elective", 3, 1, 9],
      ["elec-2", "Elective II", "elective", 3, 2, 9],
      ["gen-4", "Gen Ed IV", "gened", 4, 2, 9],
      ["gen-1", "Gen Ed I", "gened", 2, 1, 10],
      ["gen-2", "Gen Ed II", "gened", 3, 2, 10],
      ["gen-3", "Gen Ed III", "gened", 4, 1, 10],
      ["gen-5", "Gen Ed V", "gened", 4, 2, 10],
      ["free-1", "Free I", "free", 3, 1, 11],
      ["free-2", "Free II", "free", 4, 1, 11],
      ["gen-6", "Gen Ed VI", "gened", 4, 2, 11],
    ]),
  ],
  edges: [...CS66_CORE_EDGES, ...CS66_INTERN_TRACK.edges],
};
