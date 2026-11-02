import { Skeleton } from "@/components/ui/skeleton";

// เงาของผังจริง: แถวหัวคอลัมน์ + ตารางกล่องขนาดเท่ากล่องวิชา (128×50) จองความสูงไว้กันหน้ากระโดด
export function RoadmapSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border p-6" aria-busy="true" aria-label="กำลังโหลดผัง">
      <div className="flex gap-12">
        {Array.from({ length: 10 }).map((_, col) => (
          <div key={col} className="grid w-32 shrink-0 content-start gap-10.5">
            <Skeleton className="mx-auto h-4 w-24" />
            <Skeleton className="mx-auto mb-6 h-4 w-20" />
            {Array.from({ length: col % 3 === 0 ? 7 : 5 }).map((_, row) => (
              <Skeleton key={row} className="h-12.5 w-full rounded-xs" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
