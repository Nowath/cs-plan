"use client";

import { useMemo, useState, type KeyboardEvent, type Ref } from "react";
import { GEOM, type ChartModel, type ChartNode, type SlotInfo } from "@/lib/plan/build";

// วาดผังเป็น SVG ตามต้นแบบ docs/prototype/cs-roadmap.html — ตำแหน่งและเส้นคำนวณมาจาก server แล้ว
// ที่นี่ดูแลแค่ไฮไลต์สายวิชาและการเปิดแผงเติมวิชา

const { H } = GEOM;

const STROKE: Record<ChartNode["status"], { color?: string; width: number; dash?: string }> = {
  passed: { width: 1.4 },
  none: { width: 1.4 },
  enrolled: { color: "var(--status-now)", width: 3 },
  planned: { color: "var(--status-now)", width: 2, dash: "6 4" },
  failed: { color: "var(--status-warn)", width: 3 },
  // ถอน = ยังต้องลงใหม่เหมือนค้าง แต่เส้นประบอกว่าเคยลงไปแล้ว
  withdrawn: { color: "var(--status-warn)", width: 2, dash: "6 4" },
  behind: { color: "var(--status-warn)", width: 3 },
};

const BADGE_FILL: Partial<Record<ChartNode["status"], string>> = {
  passed: "var(--status-pass)",
  enrolled: "var(--status-now)",
  planned: "var(--status-now)",
  failed: "var(--status-warn)",
  withdrawn: "var(--status-warn)",
  behind: "var(--status-warn)",
};

// สระบน/ล่างและวรรณยุกต์ไม่กินความกว้าง ไม่นับตอนกะขนาดป้าย
const visibleLength = (s: string) => s.replace(/[ัิ-ฺ็-๎]/g, "").length;

export function RoadmapChart({
  model,
  onSelectSlot,
  ref,
}: {
  model: ChartModel;
  onSelectSlot: (info: SlotInfo) => void;
  /** ใช้ตอน export เป็น PNG */
  ref?: Ref<SVGSVGElement>;
}) {
  const [active, setActive] = useState<string | null>(null);

  // ไล่สายทั้งขึ้นและลง: วิชาที่ต้องผ่านก่อน + วิชาที่ต่อจากมัน
  const graph = useMemo(() => {
    const up = new Map<string, string[]>();
    const down = new Map<string, string[]>();
    for (const e of model.edges) {
      down.set(e.from, [...(down.get(e.from) ?? []), e.to]);
      up.set(e.to, [...(up.get(e.to) ?? []), e.from]);
    }
    return { up, down };
  }, [model.edges]);

  const lit = useMemo(() => {
    if (!active) return null;
    const set = new Set([active]);
    const walk = (id: string, map: Map<string, string[]>) => {
      for (const next of map.get(id) ?? []) {
        if (!set.has(next)) {
          set.add(next);
          walk(next, map);
        }
      }
    };
    walk(active, graph.up);
    walk(active, graph.down);
    return set;
  }, [active, graph]);

  const activate = (n: ChartNode) => {
    setActive(n.id);
    if (n.info) onSelectSlot(n.info);
  };

  const onKey = (e: KeyboardEvent, n: ChartNode) => {
    if (n.info && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelectSlot(n.info);
    }
  };

  return (
    <svg
      ref={ref}
      className="roadmap block font-chart"
      data-dim={lit ? "" : undefined}
      width={model.width}
      height={model.height}
      viewBox={`0 0 ${model.width} ${model.height}`}
      role="group"
      aria-label="ผังวิชาตามเทอม พร้อมลูกศร prerequisite และสถานะการเรียน"
      onClick={() => setActive(null)}
    >
      <defs>
        {/* context-stroke: หัวลูกศรเปลี่ยนสีตามเส้นตอนไฮไลต์ */}
        <marker id="rm-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="context-stroke" />
        </marker>
      </defs>

      {/* แถบสีประจำชั้นปีอยู่ล่างสุด: พื้นจางครอบทุกเทอมของปี + แถบเข้มด้านบนบอกว่าเป็นปีไหน */}
      {model.years.map((y) => (
        <g key={y.year}>
          <rect x={y.x} y={10} width={y.w} height={model.height - 18} rx={10} fill={`var(--year-${y.year}-wash)`} />
          <rect x={y.x} y={10} width={y.w} height={4} rx={2} fill={`var(--year-${y.year})`} />
        </g>
      ))}

      {model.columns.map((c, i) => {
        const x = GEOM.X0 + i * GEOM.PITCH;
        const cx = x + GEOM.W / 2;
        return (
          <g key={c.key}>
            {/* "ตอนนี้" เป็นกรอบประแทนพื้นทึบ เพื่อไม่ให้ทับสีของปี */}
            {c.isNow && (
              <rect
                x={x - 8}
                y={20}
                width={GEOM.W + 16}
                height={model.height - 30}
                rx={8}
                fill="none"
                stroke="var(--status-now)"
                strokeWidth={1.5}
                strokeDasharray="6 5"
              />
            )}
            {c.credits && (
              <text x={cx} y={36} textAnchor="middle" fontSize={13} fill="var(--ink-soft)">{c.credits}</text>
            )}
            <text
              x={cx}
              y={58}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill={c.isNow ? "var(--status-now)" : `var(--year-${c.term.year})`}
            >
              {c.label}
            </text>
            {c.gpa && (
              <text x={cx} y={80} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--status-pass)">
                {c.gpa}
              </text>
            )}
            {c.isNow && (
              <text x={cx} y={102} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--status-now)">
                ◆ ตอนนี้ {c.academic}
              </text>
            )}
          </g>
        );
      })}

      <text x={model.corner.x} y={GEOM.Y0 + 30} textAnchor="middle" fontSize={14} fill="var(--ink)">
        {model.corner.total}
      </text>
      <text x={model.corner.x} y={GEOM.Y0 + 80} textAnchor="middle" fontSize={18} fill="var(--ink)">
        {model.corner.title}
      </text>

      {model.edges.map((e) => (
        <path
          key={`${e.from}>${e.to}`}
          className="rm-edge"
          data-hl={lit?.has(e.from) && lit.has(e.to) ? "" : undefined}
          d={e.d}
          fill="none"
          stroke="var(--edge)"
          strokeWidth={1.25}
          strokeLinejoin="round"
          strokeDasharray={e.coreq ? "5 4" : undefined}
          markerEnd="url(#rm-arrow)"
        />
      ))}

      {model.nodes.map((n) => (
        <Node
          key={n.id}
          node={n}
          highlighted={!!lit?.has(n.id)}
          onEnter={() => setActive(n.id)}
          onLeave={() => setActive(null)}
          onActivate={() => activate(n)}
          onKey={(e) => onKey(e, n)}
        />
      ))}
    </svg>
  );
}

function Node({
  node: n,
  highlighted,
  onEnter,
  onLeave,
  onActivate,
  onKey,
}: {
  node: ChartNode;
  highlighted: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onActivate: () => void;
  onKey: (e: KeyboardEvent) => void;
}) {
  const cx = n.x + n.w / 2;
  const stroke = STROKE[n.status];
  const badgeFill = BADGE_FILL[n.status];
  const badgeW = n.badge ? visibleLength(n.badge) * 7 + 16 : 0;
  const label = n.info
    ? `${n.title} — ${n.info.code || n.info.current ? "กดเพื่อแก้สถานะหรือเกรด" : "กดเพื่อค้นหาและเติมวิชา"}`
    : n.title;

  return (
    <g
      // focus ring มาจาก .rm-node:focus-visible ใน globals.css — ห้ามใส่ outline-none ที่นี่ เพราะ utility ชนะ layer components
      className={n.info ? "rm-node cursor-pointer" : "rm-node"}
      data-hl={highlighted ? "" : undefined}
      tabIndex={n.ghost ? -1 : 0}
      role={n.info ? "button" : undefined}
      aria-label={label}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      onKeyDown={onKey}
    >
      <title>{label}</title>
      <rect
        x={n.x}
        y={n.y}
        width={n.w}
        height={H}
        rx={3}
        fill={n.ghost ? "none" : `var(--cat-${n.category})`}
        stroke={n.ghost ? "var(--ink-soft)" : stroke.color ?? `var(--cat-${n.category}-stroke)`}
        strokeWidth={n.ghost ? 1.4 : stroke.width}
        strokeDasharray={n.ghost ? "4 4" : stroke.dash}
      />
      <text
        x={cx}
        y={n.line2 ? n.y + 21 : n.y + H / 2 + 5}
        textAnchor="middle"
        fontSize={13}
        fill={n.ghost ? "var(--ink-soft)" : "var(--ink)"}
      >
        <tspan fontWeight={600}>{n.line1}</tspan>
        {n.line2 && (
          <tspan x={cx} dy={18} fontWeight={400}>
            {n.line2}
          </tspan>
        )}
      </text>
      {n.badge && badgeFill && (
        <g>
          <rect x={n.x + n.w - badgeW + 6} y={n.y - 10} width={badgeW} height={20} rx={10} fill={badgeFill} />
          <text
            x={n.x + n.w - badgeW / 2 + 6}
            y={n.y + 4.5}
            textAnchor="middle"
            fontSize={12.5}
            fontWeight={600}
            fill="var(--on-status)"
          >
            {n.badge}
          </text>
        </g>
      )}
      {n.note && (
        <text x={cx} y={n.y + H + 20} textAnchor="middle" fontSize={13} fill="var(--ink-soft)">
          {n.note}
        </text>
      )}
    </g>
  );
}
