"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEMPLATES, templateFor } from "@/data";

// ช่องเลือกแผนการเรียน + ปีที่เข้าเรียน ใช้ร่วมกันทั้งตอนเริ่มแผนครั้งแรกและตอนเปลี่ยนแผน

export function TemplateFields({
  curriculumId,
  entryYear,
  onChange,
}: {
  curriculumId: string;
  entryYear: number;
  onChange: (next: { curriculumId: string; entryYear: number }) => void;
}) {
  const years = templateFor(curriculumId)?.entryYears ?? [];
  const yearItems = Object.fromEntries(years.map((y) => [String(y), `${y} (รหัส ${String(y).slice(-2)})`]));

  return (
    <div className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm text-muted-foreground">แผนการเรียน</legend>
        <RadioGroup
          value={curriculumId}
          onValueChange={(v) => {
            const t = templateFor(v as string);
            if (!t) return;
            // ปีเดิมใช้กับหลักสูตรใหม่ไม่ได้ → เลือกปีล่าสุดของหลักสูตรนั้นให้ ผู้ใช้เปลี่ยนต่อได้
            const year = t.entryYears.includes(entryYear) ? entryYear : t.entryYears.at(-1)!;
            onChange({ curriculumId: t.curriculum.id, entryYear: year });
          }}
          className="grid gap-2 sm:grid-cols-2"
        >
          {TEMPLATES.map((t) => (
            <Label
              key={t.curriculum.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-checked:border-primary has-data-checked:bg-primary/5"
            >
              <RadioGroupItem value={t.curriculum.id} className="mt-1" />
              {/* Label ของ shadcn ตั้ง leading-none ไว้ — ข้อความไทยหลายบรรทัดจะสระชนกัน จึงคืนระยะบรรทัดตรงนี้ */}
              <span className="grid gap-0.5 leading-snug">
                <span className="font-medium">{t.label}</span>
                <span className="text-sm leading-normal text-muted-foreground">{t.description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="entry-year" className="text-sm text-muted-foreground">ปีการศึกษาที่เข้าเรียน</Label>
        <Select
          items={yearItems}
          value={String(entryYear)}
          onValueChange={(v) => v && onChange({ curriculumId, entryYear: Number(v) })}
        >
          <SelectTrigger id="entry-year" className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{yearItems[String(y)]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
