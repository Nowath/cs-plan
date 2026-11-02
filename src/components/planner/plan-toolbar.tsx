"use client";

import { useRef, useState } from "react";
import { DownloadIcon, FileDownIcon, FileUpIcon, Loader2Icon, Settings2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { curriculumFor } from "@/data";
import { switchTemplate } from "@/lib/plan/doc";
import { exportPlanFile, readPlanFile } from "@/lib/plan/file";
import { savePlan } from "@/lib/plan/store";
import type { PlanDoc } from "@/types/plan";
import { TemplateFields } from "./template-fields";

export function PlanToolbar({
  doc,
  onSavePng,
  exportingPng,
}: {
  doc: PlanDoc;
  onSavePng: () => void;
  exportingPng: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  // ไฟล์ที่เลือกแล้วรอยืนยันว่าจะทับแผนปัจจุบัน
  const [pending, setPending] = useState<PlanDoc | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending(await readPlanFile(file));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings2Icon />
          เปลี่ยนแผน
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <FileUpIcon />
          นำเข้า .json
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportPlanFile(doc)}>
          <FileDownIcon />
          ส่งออก .json
        </Button>
        <Button variant="outline" size="sm" onClick={onSavePng} disabled={exportingPng} aria-busy={exportingPng}>
          {exportingPng ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
          บันทึกเป็น PNG
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>แทนแผนปัจจุบันด้วยไฟล์นี้?</AlertDialogTitle>
            <AlertDialogDescription>
              แผนที่อยู่ในเบราว์เซอร์ตอนนี้จะถูกแทนทั้งหมด ถ้ายังไม่ได้ส่งออกไว้ ให้กดยกเลิกแล้วส่งออก .json ก่อน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                savePlan(pending);
                setPending(null);
                toast.success("นำเข้าแผนแล้ว");
              }}
            >
              แทนแผน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          {/* key: เปิดใหม่ทุกครั้งเริ่มจากค่าปัจจุบัน ไม่ใช่ค่าที่เลือกค้างจากครั้งก่อน */}
          {settingsOpen && (
            <PlanSettings
              key={doc.updatedAt}
              doc={doc}
              onDone={() => setSettingsOpen(false)}
              onReset={() => setConfirmReset(true)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ล้างแผนทั้งหมด?</AlertDialogTitle>
            <AlertDialogDescription>
              เกรด วิชาที่เติม และการย้ายช่องทั้งหมดในเบราว์เซอร์นี้จะหาย แล้วกลับไปหน้าเลือกแผน ย้อนกลับไม่ได้
              ถ้าอยากเก็บไว้ ให้ส่งออก .json ก่อน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmReset(false);
                setSettingsOpen(false);
                savePlan(null);
              }}
            >
              ล้างแผน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PlanSettings({ doc, onDone, onReset }: { doc: PlanDoc; onDone: () => void; onReset: () => void }) {
  const [choice, setChoice] = useState({ curriculumId: doc.base.curriculumId, entryYear: doc.base.entryYear });
  const changedYear = choice.entryYear !== doc.base.entryYear;
  const hasHistory = doc.base.enrollments.length > 0 || Object.keys(doc.edits.status).length > 0;

  const apply = () => {
    let next = doc;
    let dropped = 0;
    if (choice.curriculumId !== doc.base.curriculumId) {
      ({ doc: next, dropped } = switchTemplate(doc, curriculumFor(choice.curriculumId)));
    }
    if (changedYear) next = { ...next, base: { ...next.base, entryYear: choice.entryYear } };
    savePlan({ ...next, updatedAt: new Date().toISOString() });
    toast.success(dropped ? `เปลี่ยนแผนแล้ว (${dropped} รายการไม่มีช่องในแผนใหม่ แต่ยังนับ GPA)` : "บันทึกแล้ว");
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading font-medium">แผนการเรียน</DialogTitle>
        <DialogDescription>เปลี่ยนแผนแล้วประวัติการเรียนยังอยู่ครบ วิชาที่ไม่มีช่องในแผนใหม่จะไม่แสดงในผังแต่ยังนับ GPA</DialogDescription>
      </DialogHeader>
      <TemplateFields curriculumId={choice.curriculumId} entryYear={choice.entryYear} onChange={setChoice} />
      {changedYear && hasHistory && (
        <p className="text-sm text-warn">
          เปลี่ยนปีที่เข้าแล้ววิชาที่ลงไว้จะย้ายคอลัมน์ตาม เพราะชั้นปีคิดจากปีการศึกษา − ปีที่เข้า + 1
        </p>
      )}
      <DialogFooter className="flex-wrap gap-2 sm:justify-between">
        <Button variant="ghost" className="text-destructive" onClick={onReset}>
          ล้างแผนทั้งหมด
        </Button>
        <Button onClick={apply}>บันทึก</Button>
      </DialogFooter>
    </>
  );
}
