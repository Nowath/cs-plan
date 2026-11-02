import type { PlanDoc } from "@/types/plan";
import { parsePlanDoc } from "./doc";

// ที่เก็บแผนของผู้ใช้: localStorage ของเบราว์เซอร์นั้น — ไม่มีอะไรส่งไป server คนอื่นจึงไม่เห็นข้อมูลกัน
// ถ้า localStorage ใช้ไม่ได้ (private mode/บล็อก site data) ยังใช้งานได้ในหน้านี้ แต่ปิดหน้าแล้วหาย

const KEY = "cs-study-planner:plan:v1";
const EVENT = "plan-change";

let memory: string | null = null;
let storageOk = true;

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    storageOk = false;
    return memory;
  }
}

// useSyncExternalStore ต้องได้ object ตัวเดิมถ้าข้อมูลไม่เปลี่ยน ไม่งั้น render วนไม่จบ → แคชตามสตริงดิบ
let cachedRaw: string | null | undefined;
let cachedDoc: PlanDoc | null = null;

export function getPlan(): PlanDoc | null {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedDoc;
  cachedRaw = raw;
  if (!raw) return (cachedDoc = null);
  try {
    const parsed = parsePlanDoc(JSON.parse(raw));
    // ข้อมูลเสียในเครื่อง (แก้มือ/เวอร์ชันเก่า) ถือว่ายังไม่มีแผน แต่ไม่ลบทิ้ง เผื่อกู้คืนเองได้
    cachedDoc = parsed.ok ? parsed.doc : null;
  } catch {
    cachedDoc = null;
  }
  return cachedDoc;
}

export function savePlan(doc: PlanDoc | null) {
  const raw = doc ? JSON.stringify(doc) : null;
  memory = raw;
  try {
    if (raw) localStorage.setItem(KEY, raw);
    else localStorage.removeItem(KEY);
    storageOk = true;
  } catch {
    // เต็มหรือถูกบล็อก — เก็บในหน่วยความจำไปก่อน หน้าเว็บบอกผู้ใช้ให้ส่งออกไฟล์ไว้
    storageOk = false;
  }
  window.dispatchEvent(new Event(EVENT));
}

export const isStorageAvailable = () => storageOk;

export function subscribePlan(onChange: () => void) {
  // storage event = แท็บอื่นแก้แผน ให้แท็บนี้ตามทันที
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
