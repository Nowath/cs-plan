import { CATEGORY_LABEL } from "@/lib/plan/labels";
import type { Category } from "@/types/plan";

// class ต้องเขียนเต็มเป็นสตริงคงที่ Tailwind ถึงจะหาเจอตอน build
const SWATCH: Record<Category, string> = {
  core: "bg-(--cat-core) border-(--cat-core-stroke)",
  sci: "bg-(--cat-sci) border-(--cat-sci-stroke)",
  eng: "bg-(--cat-eng) border-(--cat-eng-stroke)",
  elective: "bg-(--cat-elective) border-(--cat-elective-stroke)",
  gened: "bg-(--cat-gened) border-(--cat-gened-stroke)",
  free: "bg-(--cat-free) border-(--cat-free-stroke)",
  coop: "bg-(--cat-coop) border-(--cat-coop-stroke)",
  minor: "bg-(--cat-minor) border-(--cat-minor-stroke)",
  honors: "bg-(--cat-honors) border-(--cat-honors-stroke)",
};

const STATUS = [
  { label: "ผ่านแล้ว + เกรด", className: "border bg-pass border-pass" },
  { label: "กำลังเรียน", className: "border-[2.5px] border-now" },
  { label: "วางแผนไว้ (ป้ายบอกเทอม)", className: "border-2 border-dashed border-now" },
  { label: "ค้าง / ตก", className: "border-[2.5px] border-warn" },
];

function Item({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden className={`inline-block h-3 w-4.5 rounded-xs border ${swatch}`} />
      {children}
    </li>
  );
}

/** categories = หมวดที่มีในแผนนี้ — ไม่โชว์หมวดที่แผนไม่มี (เช่น วิชาโทในแผนเอกเดี่ยว) */
export function Legend({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-2 text-sm text-muted-foreground">
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="สีตามหมวดวิชา">
        {(Object.keys(SWATCH) as Category[]).filter((c) => categories.includes(c)).map((c) => (
          <Item key={c} swatch={SWATCH[c]}>{CATEGORY_LABEL[c]}</Item>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="สถานะ">
        {STATUS.map((s) => (
          <Item key={s.label} swatch={s.className}>{s.label}</Item>
        ))}
        <li className="whitespace-nowrap">─▶ prerequisite</li>
        <li className="whitespace-nowrap">┄▶ corequisite</li>
      </ul>
    </div>
  );
}
