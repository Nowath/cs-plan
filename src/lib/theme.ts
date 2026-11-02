// theme ของเว็บ: "system" = ตามเครื่อง (ไม่มี data-theme บน <html>) · "light"/"dark" = ผู้ใช้เลือกเอง
// เก็บใน localStorage เพราะเป็นค่าส่วนตัวของเบราว์เซอร์นั้น ไม่ต้องส่งไป server (หน้าเลยยัง prerender ได้)

export type ThemeMode = "system" | "light" | "dark";

export const THEME_KEY = "theme";
export const THEME_EVENT = "themechange";

/**
 * รันใน <head> ก่อนหน้าวาดครั้งแรก กันจอกะพริบสีผิดตอนโหลด (แนวทางจาก Next guide: preventing-flash-before-hydration)
 * try/catch เพราะ localStorage อาจถูกบล็อก (private mode / ปิด site data)
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function readTheme(): ThemeMode {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  try {
    if (mode === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  } catch {
    // บันทึกไม่ได้ก็ยังสลับได้ในหน้านี้ แค่ไม่จำข้ามการโหลด
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
