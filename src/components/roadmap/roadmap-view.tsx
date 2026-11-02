"use client";

import { useState, type Ref } from "react";
import type { ChartModel, SlotInfo } from "@/lib/plan/build";
import { RoadmapChart } from "./roadmap-chart";
import { SlotSheet, type SlotActions } from "./slot-sheet";

export function RoadmapView({
  model,
  actions,
  svgRef,
}: {
  model: ChartModel;
  actions: SlotActions;
  /** ให้ปุ่มบันทึก PNG เข้าถึง SVG ของผัง */
  svgRef?: Ref<SVGSVGElement>;
}) {
  const [info, setInfo] = useState<SlotInfo | null>(null);
  const [open, setOpen] = useState(false);

  // แผนเปลี่ยนแล้ว (บันทึกจากแผง/แท็บอื่น) ให้แผงที่เปิดอยู่ใช้ข้อมูลล่าสุดของช่องเดิม
  const current = info ? (model.nodes.find((n) => n.id === info.slotId)?.info ?? info) : null;

  return (
    <>
      {/* ผังกว้างกว่าจอมือถือ ให้เลื่อนแนวนอนในกล่องตัวเอง ไม่ดันทั้งหน้า */}
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border bg-background">
        <RoadmapChart
          ref={svgRef}
          model={model}
          onSelectSlot={(i) => {
            setInfo(i);
            setOpen(true);
          }}
        />
      </div>
      {/* ไม่ล้าง info ตอนปิด ให้เนื้อหาอยู่ครบระหว่าง animation ปิดแผง */}
      <SlotSheet
        info={current}
        open={open}
        onOpenChange={setOpen}
        usedCodes={model.usedCodes}
        termOptions={model.termOptions}
        actions={actions}
      />
    </>
  );
}
