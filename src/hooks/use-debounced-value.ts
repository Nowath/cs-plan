import { useEffect, useState } from "react";

/** หน่วงค่าไว้จนผู้ใช้หยุดพิมพ์ — ใช้กับ effect ที่ยิง request ไม่ใช่กับค่าใน input */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
