"use client";

import { useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CourseHit } from "@/lib/cugetreg";
import type { SlotInfo } from "@/lib/plan/build";
import { CATEGORY_LABEL, GRADES_FOR, STATUS_LABEL } from "@/lib/plan/labels";
import { cn } from "@/lib/utils";
import type { AcademicTerm, Grade, PickedCourse, StatusEdit } from "@/types/plan";
import { CoursePicker } from "./course-picker";

type TermOption = { value: AcademicTerm; label: string };

/** การบันทึกลงแผนในเบราว์เซอร์ — โยน Error ถ้าข้อมูลไม่ผ่านกติกา (ข้อความเป็นภาษาไทยพร้อมโชว์) */
export type SlotActions = {
  fill: (slotId: string, course: PickedCourse | null) => void;
  status: (slotId: string, edit: StatusEdit | null) => void;
};

export function SlotSheet({
  info,
  open,
  onOpenChange,
  usedCodes,
  termOptions,
  actions,
}: {
  info: SlotInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usedCodes: Record<string, string>;
  termOptions: TermOption[];
  actions: SlotActions;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {/* key ตามช่อง: เปลี่ยนช่องแล้วล้างค่าในฟอร์ม/คำค้นของช่องก่อนทิ้งทั้งหมด */}
        {info && (
          <SlotBody
            key={info.slotId}
            info={info}
            usedCodes={usedCodes}
            termOptions={termOptions}
            actions={actions}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SlotBody({
  info,
  usedCodes,
  termOptions,
  actions,
  onDone,
}: {
  info: SlotInfo;
  usedCodes: Record<string, string>;
  termOptions: TermOption[];
  actions: SlotActions;
  onDone: () => void;
}) {
  /** ทุกการบันทึกผ่านทางนี้: แจ้งผล → ปิดแผง · ถ้าไม่ผ่านกติกา แจ้ง error แล้วคงแผงไว้ให้แก้ */
  const commit = (run: () => void, message: string) => {
    try {
      run();
      toast.success(message);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const title = info.code ? `${info.code} ${info.slotName}` : info.slotName;
  const moved = info.termLabel !== info.curriculumTermLabel;
  const hasCourse = !!info.code || !!info.current;

  const pick = (c: CourseHit) => {
    const course: PickedCourse = { code: c.courseNo, name: c.abbrName, credits: c.credit, genEdType: c.genEdType };
    commit(() => actions.fill(info.slotId, course), `เติม ${c.courseNo} ลง ${info.slotName} แล้ว`);
  };

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <SheetTitle className="font-heading text-lg font-medium">{title}</SheetTitle>
        <SheetDescription>
          {CATEGORY_LABEL[info.category]} · {info.credits} หน่วยกิต · ผังของภาคอยู่{info.curriculumTermLabel}
          {moved && ` (ย้ายไป${info.termLabel})`}
        </SheetDescription>
      </SheetHeader>

      <div className="grid min-h-0 flex-1 content-start gap-6 overflow-y-auto overscroll-contain p-4">
        {!info.code && info.current && (
          <section className="grid gap-2" aria-label="วิชาที่อยู่ในช่องนี้">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-chart font-semibold">
                  {info.current.code}{" "}
                  <span className="font-normal text-muted-foreground">({info.current.credits})</span>
                </p>
                <p className="text-sm text-muted-foreground">{info.current.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => commit(() => actions.fill(info.slotId, null), `ล้าง ${info.slotName} แล้ว`)}
              >
                ล้างวิชา
              </Button>
            </div>
            {info.current.unconfirmed && (
              <p className="text-sm text-warn">
                ยังไม่ยืนยันกับภาคว่าวิชานี้นับเป็น {CATEGORY_LABEL[info.category]} ได้
              </p>
            )}
          </section>
        )}

        {hasCourse ? (
          <StatusForm info={info} termOptions={termOptions} actions={actions} commit={commit} />
        ) : (
          <p className="text-sm text-muted-foreground">ช่องนี้ยังไม่มีวิชา เลือกวิชาก่อนแล้วค่อยตั้งสถานะหรือเกรด</p>
        )}

        {!info.code && <CoursePicker info={info} usedCodes={usedCodes} saving={null} onPick={pick} />}
      </div>
    </>
  );
}

function StatusForm({
  info,
  termOptions,
  actions,
  commit,
}: {
  info: SlotInfo;
  termOptions: TermOption[];
  actions: SlotActions;
  commit: (run: () => void, message: string) => void;
}) {
  const initial: StatusEdit = {
    status: info.current?.status ?? "none",
    grade: info.current?.grade && info.current.grade !== "W" ? info.current.grade : undefined,
    term: info.current?.term ?? info.academic,
  };
  const [status, setStatus] = useState(initial.status);
  const [grade, setGrade] = useState<Grade | undefined>(initial.grade);
  const [term, setTerm] = useState<AcademicTerm>(initial.term);

  const gradeChoices = GRADES_FOR[status];
  const needsGrade = !!gradeChoices;
  const changed = status !== initial.status || grade !== initial.grade || term !== initial.term;
  const valid = !needsGrade || (!!grade && gradeChoices.includes(grade));

  const termItems = Object.fromEntries(termOptions.map((t) => [t.value, `${t.value} · ${t.label}`]));

  const save = () =>
    commit(
      () => actions.status(info.slotId, { status, term, ...(needsGrade && { grade }) }),
      `บันทึกสถานะ ${info.code ?? info.current?.code ?? info.slotName} แล้ว`,
    );

  const reset = () => commit(() => actions.status(info.slotId, null), "คืนค่าเดิมแล้ว");

  return (
    <section className="grid gap-4" aria-label="สถานะและเกรด">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading font-medium">สถานะและเกรด</h3>
        {info.edited.status && <Badge variant="secondary">แก้จากหน้าเว็บ</Badge>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="สถานะ" id="st-status">
          <Select
            items={STATUS_LABEL}
            value={status}
            onValueChange={(v) => {
              if (!v) return;
              const next = v as StatusEdit["status"];
              setStatus(next);
              // เกรดเดิมใช้กับสถานะใหม่ไม่ได้ (เช่นจากผ่าน A เป็นตก) ให้เลือกใหม่ ไม่เดาให้
              if (!GRADES_FOR[next]?.includes(grade as Grade)) setGrade(undefined);
            }}
          >
            <SelectTrigger id="st-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as StatusEdit["status"][]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {needsGrade && (
          <Field label="เกรด" id="st-grade">
            <Select value={grade ?? null} onValueChange={(v) => v && setGrade(v as Grade)}>
              <SelectTrigger id="st-grade" className="w-full font-chart" aria-invalid={!grade}>
                <SelectValue placeholder="เลือกเกรด" />
              </SelectTrigger>
              <SelectContent>
                {gradeChoices.map((g) => (
                  <SelectItem key={g} value={g} className="font-chart">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {status !== "none" && (
          <Field label="เทอม" id="st-term" className="sm:col-span-2">
            <Select items={termItems} value={term} onValueChange={(v) => v && setTerm(v as AcademicTerm)}>
              <SelectTrigger id="st-term" className="w-full font-chart">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="font-chart">
                    {termItems[t.value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

      {status !== "none" && term !== info.academic && status !== "failed" && status !== "withdrawn" && (
        <p className="text-sm text-muted-foreground">กล่องจะย้ายไปคอลัมน์ของเทอม {term}</p>
      )}
      {info.fromBase && (
        <p className="text-sm text-muted-foreground">
          ค่าตั้งต้นมาจากไฟล์ที่นำเข้า ค่าที่แก้ตรงนี้เก็บแยกไว้ และกดคืนค่าเดิมได้
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button disabled={!changed || !valid} onClick={save}>
          บันทึกสถานะ
        </Button>
        {info.edited.status && (
          <Button variant="outline" onClick={reset}>
            <RotateCcwIcon />
            คืนค่าเดิม
          </Button>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  id,
  className,
  children,
}: {
  label: string;
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
