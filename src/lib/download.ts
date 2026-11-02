/** ให้เบราว์เซอร์ดาวน์โหลด Blob เป็นไฟล์ — ใช้ร่วมกันทั้ง PNG และไฟล์สำรองแผน .json */
export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  // ให้เบราว์เซอร์เริ่มดาวน์โหลดก่อนค่อยคืนหน่วยความจำ
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
