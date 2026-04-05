"use client";

import { SCHIJF_VAN_5_COLORS, SCHIJF_VAN_5_LABELS } from "@/lib/types";
import type { NutritionInfo } from "@/lib/types";

interface SchijfVan5Props {
  nutrition: Partial<NutritionInfo>;
  size?: number;
}

const DAILY_TARGETS: Record<string, number> = {
  groente_fruit: 5,
  granen: 6,
  zuivel: 3,
  vis_vlees_ei: 2,
  smeer_kook: 2,
};

export function SchijfVan5({ nutrition, size = 200 }: SchijfVan5Props) {
  const categories = Object.keys(DAILY_TARGETS);
  const total = categories.length;
  const segmentAngle = 360 / total;
  const center = size / 2;
  const radius = size / 2 - 8;

  function getArc(index: number, fillRatio: number) {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle =
      ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
    const innerRadius = radius * 0.4;
    const outerRadius = innerRadius + (radius - innerRadius) * Math.min(fillRatio, 1);

    const x1 = center + outerRadius * Math.cos(startAngle);
    const y1 = center + outerRadius * Math.sin(startAngle);
    const x2 = center + outerRadius * Math.cos(endAngle);
    const y2 = center + outerRadius * Math.sin(endAngle);
    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);

    const largeArc = segmentAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  function getBackgroundArc(index: number) {
    return getArc(index, 1);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {categories.map((cat, i) => {
          const value =
            (nutrition as Record<string, number>)[cat] ?? 0;
          const target = DAILY_TARGETS[cat];
          const ratio = value / target;

          return (
            <g key={cat}>
              <path
                d={getBackgroundArc(i)}
                fill="var(--border)"
                stroke="var(--background)"
                strokeWidth="2"
              />
              <path
                d={getArc(i, ratio)}
                fill={SCHIJF_VAN_5_COLORS[cat]}
                opacity={0.85}
                stroke="var(--background)"
                strokeWidth="2"
              />
            </g>
          );
        })}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.38}
          fill="var(--card)"
        />
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="text-sm font-bold fill-foreground"
        >
          {nutrition.calories ?? 0}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="text-[10px] fill-muted"
        >
          kcal
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        {categories.map((cat) => {
          const value =
            (nutrition as Record<string, number>)[cat] ?? 0;
          const target = DAILY_TARGETS[cat];
          return (
            <div key={cat} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SCHIJF_VAN_5_COLORS[cat] }}
              />
              <span className="text-muted">
                {SCHIJF_VAN_5_LABELS[cat]}
              </span>
              <span className="font-medium ml-auto">
                {value}/{target}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
