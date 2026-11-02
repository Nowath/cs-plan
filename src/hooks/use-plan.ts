import { useSyncExternalStore } from "react";
import { getPlan, subscribePlan } from "@/lib/plan/store";
import type { PlanDoc } from "@/types/plan";

/**
 * แผนของผู้ใช้จาก localStorage
 * undefined = ยังไม่ได้อ่าน (ฝั่ง server / ก่อน hydrate) → แสดง skeleton · null = ยังไม่มีแผน → หน้าเลือกแผน
 */
export function usePlan(): PlanDoc | null | undefined {
  return useSyncExternalStore(subscribePlan, getPlan, () => undefined);
}
