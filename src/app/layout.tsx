import type { Metadata } from "next";
import { Anuphan, IBM_Plex_Sans, Kanit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// โหลดเฉพาะ weight ที่ใช้จริง — ฟอนต์ไทยไฟล์ใหญ่ ใส่เกินคือถ่วงหน้าเว็บ
const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-anuphan",
  display: "swap",
});

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
  variable: "--font-kanit",
  display: "swap",
});

// ตัวเลขและรหัสวิชาในผัง ให้หน้าตาเหมือนผังต้นแบบ
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "แผนเรียนวิทย์คอมฯ",
  description: "ผัง course dependency ของหลักสูตร CS-66 พร้อมสถานะการเรียนจริง",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: สคริปต์ใน <head> ใส่ data-theme ก่อน React hydrate จึงต่างจาก HTML ที่ server ส่งมาโดยตั้งใจ
    <html
      lang="th"
      className={`${anuphan.variable} ${kanit.variable} ${plex.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
