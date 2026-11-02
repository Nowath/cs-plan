import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, THEME_EVENT, THEME_KEY, type ThemeMode } from "@/lib/theme";

// แหล่งความจริงคือ data-theme บน <html> (สคริปต์ใน <head> ตั้งไว้ก่อน hydrate)
// ฟัง storage ด้วย เพื่อให้แท็บอื่นที่เปิดค้างไว้เปลี่ยนตามกัน
function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    const v = e.newValue;
    applyTheme(v === "light" || v === "dark" ? v : "system");
  };
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  // ฝั่ง server ไม่รู้ค่าที่ผู้ใช้เลือก จึงตอบ "system" แล้ว React จะ render ใหม่ด้วยค่าจริงหลัง hydrate โดยไม่ error
  const mode = useSyncExternalStore(subscribe, readTheme, () => "system" as const);
  return [mode, applyTheme];
}
