import type { NextRequest } from "next/server";
import { PAGE_SIZE, resolveTerm, searchCourses } from "@/lib/cugetreg";
import { ACADEMIC_TERM_RE } from "@/lib/plan/terms";
import type { AcademicTerm } from "@/types/plan";

// ตัวกลางไป CuGetReg: browser เรียกตรงไม่ได้เพราะ CORS และจะได้ cache ผลค้นไว้ฝั่ง server
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const term = sp.get("term") ?? "";
  const keyword = (sp.get("q") ?? "").trim().slice(0, 60);
  const genEdOnly = sp.get("genEd") === "1";
  const offset = Math.min(Math.max(Number(sp.get("offset")) || 0, 0), 2000);

  if (!ACADEMIC_TERM_RE.test(term)) {
    return Response.json({ error: "รูปแบบเทอมไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const used = await resolveTerm(term as AcademicTerm);
    if (!used) {
      return Response.json({ requested: term, term: null, courses: [], hasMore: false });
    }
    const courses = await searchCourses({ term: used, keyword, genEdOnly, offset });
    return Response.json({ requested: term, term: used, courses, hasMore: courses.length === PAGE_SIZE });
  } catch {
    return Response.json({ error: "ติดต่อ CuGetReg ไม่ได้ ลองใหม่อีกครั้ง" }, { status: 502 });
  }
}
