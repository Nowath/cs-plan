import type { yearProgress } from "@/lib/plan/build";

// แถบความคืบหน้ารายชั้นปี สีเดียวกับแถบปีในผัง — ความยาวแต่ละช่วงตามหน่วยกิตของปีนั้น ส่วนทึบคือที่ผ่านแล้ว

type Item = ReturnType<typeof yearProgress>[number];

// class ต้องเป็นสตริงเต็มให้ Tailwind หาเจอตอน build
const TRACK = {
  1: "bg-(--year-1)/18",
  2: "bg-(--year-2)/18",
  3: "bg-(--year-3)/18",
  4: "bg-(--year-4)/18",
} as const;
const FILL = { 1: "bg-(--year-1)", 2: "bg-(--year-2)", 3: "bg-(--year-3)", 4: "bg-(--year-4)" } as const;
const TEXT = { 1: "text-(--year-1)", 2: "text-(--year-2)", 3: "text-(--year-3)", 4: "text-(--year-4)" } as const;

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function YearProgress({ items }: { items: Item[] }) {
  return (
    <div className="grid gap-1.5" aria-label="หน่วยกิตที่ผ่านแล้วตามผัง แยกตามชั้นปี">
      <div className="flex gap-1">
        {items.map((it) => (
          <div
            key={it.year}
            // ความกว้างแต่ละปีตามสัดส่วนหน่วยกิต ค่าเปลี่ยนตามแผนจึงต้องเป็น inline style
            style={{ flexGrow: it.required, flexBasis: 0 }}
            className={`h-2.5 overflow-hidden rounded-full ${TRACK[it.year]}`}
            role="progressbar"
            aria-label={`ปี ${it.year}`}
            aria-valuemin={0}
            aria-valuemax={it.required}
            aria-valuenow={it.earned}
          >
            <div
              className={`h-full rounded-full ${FILL[it.year]}`}
              style={{ width: `${it.required ? (it.earned / it.required) * 100 : 0}%` }}
            />
          </div>
        ))}
      </div>
      {/* มือถือ: ป้ายตัดบรรทัดได้ตามความกว้างจริง (ช่วงปี 4 แคบเกินจะใส่ข้อความ) · จอใหญ่: วางตรงใต้ช่วงของปีนั้น */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm sm:flex-nowrap sm:gap-x-1">
        {items.map((it) => (
          <p
            key={it.year}
            style={{ "--grow": it.required } as React.CSSProperties}
            className="whitespace-nowrap sm:min-w-0 sm:grow-(--grow) sm:basis-0"
          >
            <span className={`font-medium ${TEXT[it.year]}`}>ปี {it.year}</span>{" "}
            <span className="text-muted-foreground tabular-nums">
              {fmt(it.earned)}/{fmt(it.required)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
