import { useCallback, useEffect, useRef, useState } from "react";
import type { CourseHit } from "@/lib/cugetreg";

// ค้นวิชาผ่าน /api/courses แบบแบ่งหน้าที่ต้นทาง (CuGetReg รับ limit/offset)
// ยกเลิก request เก่าทุกครั้งที่คำค้นเปลี่ยน กันผลของคำเก่ามาทับผลของคำใหม่

type SearchParams = { term: string; q: string; genEd: boolean };

type Result = {
  key: string;
  requested: string;
  /** เทอมที่ค้นจริง (อาจถอยไปปีก่อนถ้าเทอมที่ขอยังไม่มีข้อมูล) · null = ไม่มีข้อมูลเลย */
  term: string | null;
  courses: CourseHit[];
  hasMore: boolean;
};

async function fetchPage(p: SearchParams, offset: number, signal: AbortSignal) {
  const qs = new URLSearchParams({ term: p.term, q: p.q, offset: String(offset) });
  if (p.genEd) qs.set("genEd", "1");
  const res = await fetch(`/api/courses?${qs}`, { signal });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "ค้นหาไม่สำเร็จ");
  return body as Omit<Result, "key">;
}

const keyOf = (p: SearchParams) => `${p.term}|${p.q}|${p.genEd ? 1 : 0}`;

export function useCourseSearch(params: SearchParams, enabled: boolean) {
  const key = keyOf(params);
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [moreLoading, setMoreLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const moreAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const ac = new AbortController();
    moreAbort.current?.abort();
    fetchPage(params, 0, ac.signal)
      .then((r) => {
        setData({ ...r, key });
        setError(null);
      })
      .catch((e: Error) => {
        if (!ac.signal.aborted) setError({ key, message: e.message });
      });
    return () => ac.abort();
    // params ถูกแทนด้วย key ที่สร้างจากค่าทุกตัวแล้ว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, attempt]);

  const loadMore = useCallback(async () => {
    if (!data || data.key !== key || !data.hasMore) return;
    const ac = new AbortController();
    moreAbort.current = ac;
    setMoreLoading(true);
    try {
      const r = await fetchPage(params, data.courses.length, ac.signal);
      setData((prev) =>
        prev && prev.key === key ? { ...prev, courses: [...prev.courses, ...r.courses], hasMore: r.hasMore } : prev,
      );
    } catch (e) {
      if (!ac.signal.aborted) setError({ key, message: (e as Error).message });
    } finally {
      setMoreLoading(false);
    }
  }, [data, key, params]);

  const retry = useCallback(() => {
    setError(null);
    setData(null);
    setAttempt((n) => n + 1);
  }, []);

  const currentError = error?.key === key ? error.message : null;
  return {
    data,
    /** ผลที่แสดงอยู่เป็นของคำค้นเก่า กำลังรอผลใหม่ */
    stale: !!data && data.key !== key && !currentError,
    loading: enabled && (!data || data.key !== key) && !currentError,
    error: currentError,
    moreLoading,
    loadMore,
    retry,
  };
}
