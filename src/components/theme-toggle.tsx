"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "@/hooks/use-theme";
import type { ThemeMode } from "@/lib/theme";

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { value: "system", label: "ตามเครื่อง", Icon: MonitorIcon },
  { value: "light", label: "สว่าง", Icon: SunIcon },
  { value: "dark", label: "มืด", Icon: MoonIcon },
];

export function ThemeToggle() {
  const [mode, setMode] = useTheme();
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      value={[mode]}
      // กดปุ่มที่เลือกอยู่ซ้ำจะได้ [] — ไม่ยอมให้ไม่มีโหมดไหนถูกเลือก
      onValueChange={(v) => v[0] && setMode(v[0] as ThemeMode)}
      aria-label="ธีมของหน้าเว็บ"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label} title={label} className="size-11 sm:size-8">
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
