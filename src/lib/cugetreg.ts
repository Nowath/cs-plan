import { cacheLife } from "next/cache";
import type { AcademicTerm, GenEdType } from "@/types/plan";

// ดึงรายวิชาจาก CuGetReg (GraphQL ไม่เป็นทางการ ไม่มีเอกสาร — ถอดจาก bundle ของเว็บเขา)
// เรียกจาก server เท่านั้น เพราะ API เปิด CORS ให้แค่ cugetreg.com

const ENDPOINT = "https://cugetreg.com/_api/graphql";
export const PAGE_SIZE = 20;

export type CourseHit = {
  courseNo: string;
  abbrName: string;
  nameTh: string;
  nameEn: string;
  credit: number;
  genEdType: GenEdType;
  department: string;
};

/** เทอมของเรา → courseGroup ของ CuGetReg (ซัมเมอร์คือ semester "3", ภาคปกติคือ studyProgram S) */
function courseGroup(term: AcademicTerm) {
  const [academicYear, s] = term.split("/");
  return { academicYear, semester: s === "S" ? "3" : s, studyProgram: "S" };
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`CuGetReg ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length || !json.data) throw new Error(json.errors?.[0]?.message ?? "CuGetReg ไม่ส่งข้อมูลกลับมา");
  return json.data;
}

const SEARCH = /* GraphQL */ `
  query Search($filter: FilterInput!, $courseGroup: CourseGroupInput!) {
    search(filter: $filter, courseGroup: $courseGroup) {
      courseNo abbrName courseNameTh courseNameEn credit genEdType department
    }
  }
`;

type RawCourse = {
  courseNo: string;
  abbrName: string;
  courseNameTh: string;
  courseNameEn: string;
  credit: number;
  genEdType: GenEdType;
  department: string;
};

/** เทอมนี้มีรายวิชาใน CuGetReg หรือยัง — เทอมอนาคตจะว่างจนกว่าสำนักทะเบียนประกาศ */
async function hasCourses(term: AcademicTerm): Promise<boolean> {
  "use cache";
  cacheLife("days");
  const data = await gql<{ search: RawCourse[] }>(SEARCH, {
    filter: { limit: 1, offset: 0 },
    courseGroup: courseGroup(term),
  });
  return data.search.length > 0;
}

/**
 * หาเทอมที่ใช้ค้นจริง: ถ้าเทอมที่ขอยังไม่มีข้อมูล ถอยไปเทอมเดียวกันของปีก่อนๆ
 * (เทอม 1 ของปีที่แล้วใกล้เคียงกับเทอม 1 ปีหน้ากว่าเทอมล่าสุดที่เป็นคนละเทอม)
 */
export async function resolveTerm(term: AcademicTerm): Promise<AcademicTerm | null> {
  const [y, s] = term.split("/");
  for (let back = 0; back < 4; back++) {
    const t = `${Number(y) - back}/${s}` as AcademicTerm;
    if (await hasCourses(t)) return t;
  }
  return null;
}

export async function searchCourses(opts: {
  term: AcademicTerm;
  keyword: string;
  genEdOnly: boolean;
  offset: number;
}): Promise<CourseHit[]> {
  "use cache";
  cacheLife("hours");
  const filter: Record<string, unknown> = { limit: PAGE_SIZE, offset: opts.offset };
  if (opts.keyword) filter.keyword = opts.keyword;
  if (opts.genEdOnly) filter.genEdTypes = ["SO", "HU", "SC", "IN"];
  const data = await gql<{ search: RawCourse[] }>(SEARCH, { filter, courseGroup: courseGroup(opts.term) });
  return data.search.map((c) => ({
    courseNo: c.courseNo,
    abbrName: c.abbrName,
    nameTh: c.courseNameTh,
    nameEn: c.courseNameEn,
    credit: c.credit,
    genEdType: c.genEdType,
    department: c.department,
  }));
}
