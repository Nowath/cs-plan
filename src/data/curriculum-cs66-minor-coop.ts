import type { Curriculum } from "@/types/plan";
import { CS66_COOP_TRACK, CS66_CORE_EDGES, CS66_CORE_SLOTS, openSlots, t } from "./cs66-common";

// ถอดจากผัง docs/reference/cs66-dependency-minor-coop.png
// (CS-66-course-dependency-09-01-2026, เอกโท-สหกิจ) — ผังเขียน "Total >= 136 credits"
export const cs66MinorCoop: Curriculum = {
  id: "cs66-minor-coop",
  title: "CS-66 Major/Minor CoOpEd",
  source: "CS-66-course-dependency-09-01-2026-เอกโท-สหกิจ.pdf",
  totalCredits: 136,
  termCredits: [
    { term: t(1, 1), credits: 18 },
    { term: t(1, 2), credits: 19 },
    { term: t(2, 1), credits: 21 },
    { term: t(2, 2), credits: 21 },
    { term: t(3, 1), credits: 21 },
    { term: t(3, 2), credits: 20 },
    { term: t(3, "S"), credits: null, note: "เริ่มสหกิจ" },
    { term: t(4, 1), credits: 6 },
    { term: t(4, 2), credits: 10 },
  ],
  slots: [
    ...CS66_CORE_SLOTS,
    ...CS66_COOP_TRACK.slots,
    ...openSlots([
      ["minor-1", "Minor I", "minor", 2, 1, 8],
      ["minor-2", "Minor II", "minor", 2, 2, 8],
      ["minor-3", "Minor III", "minor", 3, 1, 8],
      ["minor-4", "Minor IV", "minor", 3, 2, 8],
      ["minor-5", "Minor V", "minor", 4, 2, 8],
      ["elec-1", "Elective I", "elective", 3, 1, 9],
      ["elec-2", "Elective II", "elective", 3, 2, 9],
      ["gen-1", "Gen Ed I", "gened", 2, 1, 10],
      ["gen-2", "Gen Ed II", "gened", 2, 2, 10],
      ["gen-3", "Gen Ed III", "gened", 3, 1, 10],
      ["elec-3", "Elective III", "elective", 3, 2, 10],
      ["gen-5", "Gen Ed V", "gened", 4, 2, 10],
      ["free-1", "Free I", "free", 2, 1, 11],
      ["free-2", "Free II", "free", 3, 1, 11],
      ["gen-4", "Gen Ed IV", "gened", 3, 2, 11],
      ["gen-6", "Gen Ed VI", "gened", 4, 2, 11],
    ]),
  ],
  edges: [...CS66_CORE_EDGES, ...CS66_COOP_TRACK.edges],
};
