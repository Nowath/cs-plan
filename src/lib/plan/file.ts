import type { PlanDoc } from "@/types/plan";
import { downloadBlob } from "../download";
import { parsePlanDoc } from "./doc";

// ไฟล์สำรองแผน .json — วิธีเดียวที่ข้อมูลออกจากเบราว์เซอร์ได้ (ย้ายเครื่อง/กันล้าง site data)

const MAX_BYTES = 1_000_000; // แผนจริงไม่กี่สิบ KB เกินนี้แปลว่าเลือกไฟล์ผิด

export function exportPlanFile(doc: PlanDoc) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `cs-study-plan-${String(doc.base.entryYear).slice(-2)}-${date}.json`);
}

export async function readPlanFile(file: File): Promise<PlanDoc> {
  if (file.size > MAX_BYTES) throw new Error("ไฟล์ใหญ่เกินไป ไม่ใช่ไฟล์แผนของเว็บนี้");
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error("อ่านไฟล์ไม่ได้ ต้องเป็นไฟล์ .json ที่ส่งออกจากเว็บนี้");
  }
  const parsed = parsePlanDoc(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.doc;
}
