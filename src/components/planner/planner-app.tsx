"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Legend } from "@/components/roadmap/legend";
import { RoadmapSkeleton } from "@/components/roadmap/roadmap-skeleton";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import type { SlotActions } from "@/components/roadmap/slot-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { curriculumFor, templateFor } from "@/data";
import { usePlan } from "@/hooks/use-plan";
import { applyEdits, buildChart, placedTerm, summarize, yearProgress } from "@/lib/plan/build";
import { setFill, setStatus } from "@/lib/plan/doc";
import { isStorageAvailable, savePlan } from "@/lib/plan/store";
import { termLabelTh } from "@/lib/plan/terms";
import type { PlanDoc } from "@/types/plan";
import { Onboarding } from "./onboarding";
import { PlanToolbar } from "./plan-toolbar";
import { YearProgress } from "./year-progress";

// ทั้งแอปทำงานฝั่ง browser เพราะแผนของแต่ละคนอยู่ใน localStorage ของเครื่องนั้น
// server ส่งแค่โครงหน้า (prerender) ไม่เคยเห็นข้อมูลของใคร

export function PlannerApp() {
  const doc = usePlan();

  if (doc === undefined) return <PlannerSkeleton />;
  if (doc === null) {
    return (
      <>
        <TopBar eyebrow="วางแผนการเรียน วิทยาการคอมพิวเตอร์ จุฬาฯ" />
        <Onboarding />
      </>
    );
  }
  return <Planner doc={doc} />;
}

function TopBar({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <ThemeToggle />
    </div>
  );
}

function Planner({ doc }: { doc: PlanDoc }) {
  const template = templateFor(doc.base.curriculumId)!;
  const curriculum = curriculumFor(doc.base.curriculumId);
  const svgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);

  // คำนวณผังใหม่เฉพาะเมื่อแผนเปลี่ยน (doc เป็น object ใหม่ทุกครั้งที่บันทึก ตัวเดิมถ้าไม่เปลี่ยน)
  const { student, model, stats, progress } = useMemo(() => {
    const student = applyEdits(doc.base, doc.edits, curriculum);
    return {
      student,
      model: buildChart(curriculum, student, { edits: doc.edits, base: doc.base }),
      stats: summarize(student),
      progress: yearProgress(curriculum, student),
    };
  }, [doc, curriculum]);

  const actions: SlotActions = {
    fill: (slotId, course) => savePlan(setFill(doc, curriculum, slotId, course)),
    status: (slotId, edit) => savePlan(setStatus(doc, curriculum, slotId, edit)),
  };

  const yy = String(doc.base.entryYear).slice(-2);
  const milestone = curriculum.slots.find((s) => s.id === template.milestone.slotId);
  const categories = useMemo(() => [...new Set(curriculum.slots.map((s) => s.category))], [curriculum]);

  const savePng = async () => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      // โหลดโค้ด export ตอนกดเท่านั้น ไม่ถ่วงการโหลดหน้าครั้งแรก
      const { exportChartPng } = await import("@/lib/export-png");
      const now = new Date();
      const dateTh = now.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
      const summary = [
        `ผ่านแล้ว ${stats.earned}/${curriculum.totalCredits} หน่วยกิต`,
        stats.gpax != null ? `GPAX ${stats.gpax.toFixed(2)}` : null,
        `ข้อมูล ณ ${dateTh}`,
      ].filter(Boolean).join(" · ");
      await exportChartPng(svgRef.current, {
        filename: `cs-study-plan-${yy}-${now.toISOString().slice(0, 10)}.png`,
        title: `แผนเรียนวิทย์คอมฯ · ${template.label} · รหัส ${yy}`,
        subtitle: summary,
      });
    } catch (e) {
      toast.error((e as Error).message || "บันทึกรูปไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header className="grid gap-2">
        <TopBar eyebrow={`${template.label} · รหัส ${yy}`} />
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <h1 className="font-heading text-3xl leading-[1.25] font-semibold text-balance sm:text-4xl">
            แผนเรียนวิทย์คอมฯ {template.shortLabel}
          </h1>
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            <Stat value={`${stats.earned} / ${curriculum.totalCredits}`} label="หน่วยกิตที่ผ่านแล้ว" />
            <Stat
              value={stats.gpax != null ? stats.gpax.toFixed(2) : "–"}
              label={stats.lastGradedTerm ? `GPAX ถึง ${stats.lastGradedTerm}` : "GPAX (ยังไม่มีเกรด)"}
            />
            {milestone && (
              <Stat value={termLabelTh(placedTerm(milestone, student))} label={template.milestone.label} />
            )}
          </dl>
        </div>
        <div className="mt-3">
          <YearProgress items={progress} />
        </div>
      </header>

      {!isStorageAvailable() && (
        <p role="alert" className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-pretty">
          เบราว์เซอร์นี้ไม่ให้บันทึกข้อมูลลงเครื่อง (อาจเป็นโหมดส่วนตัว) แผนจะหายเมื่อปิดหน้า กดส่งออก .json เก็บไว้ก่อนปิด
        </p>
      )}

      <Legend categories={categories} />

      <section className="grid gap-3" aria-label="ผังวิชา">
        <PlanToolbar doc={doc} onSavePng={savePng} exportingPng={exporting} />
        <RoadmapView model={model} actions={actions} svgRef={svgRef} />
        <p className="text-sm text-pretty text-muted-foreground">
          ชี้หรือแตะกล่องวิชาเพื่อดูวิชาที่ต้องผ่านก่อนและวิชาที่ต่อจากมัน
          แตะกล่องเพื่อแก้สถานะ เกรด หรือเทอม ส่วนช่องวิชาเลือก Gen Ed และเลือกเสรี ค้นหาวิชาจาก CuGetReg มาเติมได้
          บนมือถือเลื่อนผังไปทางซ้ายขวาได้
        </p>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid">
      {/* dt ต้องมาก่อน dd ตาม HTML แต่ให้ตัวเลขขึ้นก่อนด้วยสายตา */}
      <dt className="order-last text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl leading-snug font-medium tabular-nums">{value}</dd>
    </div>
  );
}

// เงาของหน้าก่อนอ่านแผนจากเครื่อง: หัว + สถิติ 3 ช่อง + ผัง ขนาดใกล้ของจริง กันหน้ากระโดด
function PlannerSkeleton() {
  return (
    <>
      <div className="grid gap-2" aria-busy="true">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-64" />
          <ThemeToggle />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <Skeleton className="h-10 w-80 max-w-full" />
          <div className="flex gap-8">
            {["w-24", "w-16", "w-28"].map((w) => (
              <div key={w} className="grid gap-1.5 py-1">
                <Skeleton className={`h-6 ${w}`} />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full max-w-3xl" />
      <RoadmapSkeleton />
    </>
  );
}
