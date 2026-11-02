"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TEMPLATES } from "@/data";
import { emptyDoc } from "@/lib/plan/doc";
import { readPlanFile } from "@/lib/plan/file";
import { savePlan } from "@/lib/plan/store";
import { TemplateFields } from "./template-fields";

// หน้าแรกของคนที่ยังไม่มีแผนในเบราว์เซอร์นี้: เลือกแผนการเรียน หรือนำเข้าไฟล์สำรอง

export function Onboarding() {
  const first = TEMPLATES[0];
  const [choice, setChoice] = useState({
    curriculumId: first.curriculum.id,
    entryYear: first.entryYears.at(-2) ?? first.entryYears[0],
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      savePlan(await readPlanFile(file));
      toast.success("นำเข้าแผนแล้ว");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-medium">เริ่มวางแผนการเรียน</CardTitle>
        <CardDescription className="text-pretty">
          แผนและเกรดที่ใส่จะเก็บในเบราว์เซอร์นี้เท่านั้น ไม่ส่งไปที่ไหน คนอื่นที่เปิดเว็บนี้จึงไม่เห็นข้อมูลของคุณ
          ส่งออกเป็นไฟล์ .json ไว้สำรองหรือย้ายไปเครื่องอื่นได้
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TemplateFields curriculumId={choice.curriculumId} entryYear={choice.entryYear} onChange={setChoice} />
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <UploadIcon />
          นำเข้าไฟล์สำรอง
        </Button>
        <Button onClick={() => savePlan(emptyDoc(choice.curriculumId, choice.entryYear))}>เริ่มแผนนี้</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            importFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </CardFooter>
    </Card>
  );
}
