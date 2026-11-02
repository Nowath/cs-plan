import { PlannerApp } from "@/components/planner/planner-app";

// server ส่งแค่โครงหน้า แผนของแต่ละคนอยู่ในเบราว์เซอร์ของคนนั้น (ดู src/lib/plan/store.ts)
export default function Page() {
  return (
    <main className="mx-auto grid w-full max-w-[1680px] gap-7 px-4 py-7 sm:px-6 sm:py-10">
      <PlannerApp />
      <footer className="text-sm text-pretty text-muted-foreground">
        แผนการเรียนถอดจากผัง course dependency ของภาค · รายวิชาจาก CuGetReg · ข้อมูลของคุณเก็บในเบราว์เซอร์นี้เท่านั้น ·
        การนับหมวดของวิชาที่เติมเองยังต้องเช็กกับภาค
      </footer>
    </main>
  );
}
