"use client";

import { useState } from "react";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useCourseSearch } from "@/hooks/use-course-search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { CourseHit } from "@/lib/cugetreg";
import type { SlotInfo } from "@/lib/plan/build";
import { GEN_ED_LABEL } from "@/lib/plan/labels";
import { previousAcademicTerms } from "@/lib/plan/terms";
import { cn } from "@/lib/utils";
import type { AcademicTerm } from "@/types/plan";

// ค้นวิชาจาก CuGetReg มาเติมช่องว่าง (วิชาเลือก / Gen Ed / เสรี)

export function CoursePicker({
  info,
  usedCodes,
  saving,
  onPick,
}: {
  info: SlotInfo;
  usedCodes: Record<string, string>;
  /** รหัสวิชาที่กำลังบันทึก — ปิดปุ่มอื่นกันกดซ้อน */
  saving: string | null;
  onPick: (c: CourseHit) => void;
}) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState<AcademicTerm>(info.academic);
  const [genEd, setGenEd] = useState(info.category === "gened");

  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const search = useCourseSearch({ term, q: debouncedQ, genEd }, true);
  const termOptions = [info.academic, ...previousAcademicTerms(info.academic, 5)];

  return (
    <section className="grid gap-3" aria-label="ค้นหาวิชามาเติม">
      <h3 className="font-heading font-medium">{info.current ? "เปลี่ยนวิชา" : "เลือกวิชามาเติม"}</h3>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="รหัสหรือชื่อวิชา เช่น 2301 หรือ data"
          aria-label="ค้นหาวิชา"
          className="h-10 pl-8 text-base sm:text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="term-select" className="text-sm text-muted-foreground">เทอมที่เปิดสอน</Label>
          <Select value={term} onValueChange={(v) => v && setTerm(v as AcademicTerm)}>
            <SelectTrigger id="term-select" size="sm" className="font-chart">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {termOptions.map((t) => (
                <SelectItem key={t} value={t} className="font-chart">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {info.category === "gened" && (
          <div className="flex items-center gap-2">
            <Switch id="gened-only" checked={genEd} onCheckedChange={setGenEd} />
            <Label htmlFor="gened-only" className="text-sm">เฉพาะ Gen Ed</Label>
          </div>
        )}
      </div>
      {search.data && !search.stale && search.data.term && search.data.term !== search.data.requested && (
        <p className="text-sm text-muted-foreground">
          CuGetReg ยังไม่มีรายวิชาของ {search.data.requested} จึงแสดงวิชาที่เปิดใน {search.data.term} แทน
        </p>
      )}
      <Results search={search} info={info} usedCodes={usedCodes} saving={saving} onPick={onPick} />
    </section>
  );
}

function Results({
  search,
  info,
  usedCodes,
  saving,
  onPick,
}: {
  search: ReturnType<typeof useCourseSearch>;
  info: SlotInfo;
  usedCodes: Record<string, string>;
  saving: string | null;
  onPick: (c: CourseHit) => void;
}) {
  if (search.error) {
    return (
      <div className="grid justify-items-start gap-3">
        <p className="text-sm text-warn">{search.error}</p>
        <Button variant="outline" size="sm" onClick={search.retry}>ลองอีกครั้ง</Button>
      </div>
    );
  }

  if (search.loading && !search.data) {
    // เงาของแถวผลค้นจริง: รหัส+หน่วยกิต / ชื่ออังกฤษ / ชื่อไทย
    return (
      <div className="-mx-3 grid gap-1" aria-busy="true" aria-label="กำลังค้นหา">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid gap-2 rounded-md p-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const data = search.data;
  if (!data) return null;
  if (!data.term) {
    return <p className="text-sm text-muted-foreground">CuGetReg ยังไม่มีรายวิชาของเทอมนี้และปีก่อนหน้า ลองเลือกเทอมอื่น</p>;
  }
  if (!data.courses.length) {
    return <p className="text-sm text-muted-foreground">ไม่พบวิชาที่ตรงกับคำค้นใน {data.term}</p>;
  }

  return (
    <div
      className="-mx-3 transition-opacity duration-(--dur-fast) data-stale:opacity-60"
      data-stale={search.stale ? "" : undefined}
      aria-busy={search.stale}
    >
      <ul className="grid gap-1">
        {data.courses.map((c) => {
          const usedIn = usedCodes[c.courseNo];
          const taken = !!usedIn && usedIn !== info.slotId;
          const isCurrent = info.current?.code === c.courseNo;
          return (
            <li key={c.courseNo}>
              <button
                type="button"
                disabled={taken || isCurrent || !!saving}
                onClick={() => onPick(c)}
                className={cn(
                  "grid w-full gap-0.5 rounded-md p-3 text-left",
                  "transition-colors duration-(--dur-fast) ease-(--ease-out) hover:bg-muted",
                  "outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-55",
                )}
              >
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-chart font-semibold">{c.courseNo}</span>
                  <span className="text-sm text-muted-foreground">{c.credit} หน่วยกิต</span>
                  {c.credit !== info.credits && (
                    <span className="text-sm text-warn">ช่องนี้ {info.credits} หน่วยกิต</span>
                  )}
                  {c.genEdType !== "NO" && <Badge variant="outline">GE {GEN_ED_LABEL[c.genEdType]}</Badge>}
                  {taken && <Badge variant="secondary">อยู่ในแผนแล้ว</Badge>}
                  {isCurrent && <Badge variant="secondary">อยู่ในช่องนี้</Badge>}
                  {saving === c.courseNo && <Loader2Icon className="size-4 animate-spin" aria-label="กำลังบันทึก" />}
                </span>
                <span className="text-sm">{c.nameEn}</span>
                <span className="text-sm text-muted-foreground">{c.nameTh}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {data.hasMore && (
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={search.moreLoading}
            aria-busy={search.moreLoading}
            onClick={search.loadMore}
          >
            {search.moreLoading && <Loader2Icon className="animate-spin" />}
            โหลดเพิ่ม
          </Button>
        </div>
      )}
    </div>
  );
}
