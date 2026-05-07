"use client";

export function Sparkline({
  data,
  color = "violet",
  height = 36,
  label,
  value,
  unit,
  dayLabels,
}: {
  data: number[];
  color?: string;
  height?: number;
  label: string;
  value: string;
  unit: string;
  dayLabels?: string[];
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;

  const points = data
    .map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * w : 50;
      const y = height - ((d - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${w},${height}`;

  const colorMap: Record<string, { stroke: string; gradId: string }> = {
    violet: { stroke: "#A78BFA", gradId: "grad-violet" },
    cyan: { stroke: "#06B6D4", gradId: "grad-cyan" },
    rose: { stroke: "#FF6B6B", gradId: "grad-rose" },
    amber: { stroke: "#FFD166", gradId: "grad-amber" },
    purple: { stroke: "#7C3AED", gradId: "grad-purple" },
  };
  const c = colorMap[color] || colorMap.violet;

  const lastX = data.length > 1 ? w : 50;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <div className="glass-card rounded-[14px] p-[18px] flex flex-col gap-1.5 min-h-[150px]">
      <div className="flex items-center justify-between">
        <span className="text-ink-3 text-xs tracking-[0.06em] uppercase font-medium">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[clamp(28px,3vw,40px)] font-semibold text-ink tabular-nums tracking-tight">{value}</span>
        <span className="text-xs text-ink-3">{unit}</span>
      </div>
      <div className="mt-auto h-9">
        <svg
          viewBox={`0 0 ${w} ${height}`}
          className="w-full h-full block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={c.gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.stroke} stopOpacity="0.5" />
              <stop offset="100%" stopColor={c.stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${c.gradId})`} />
          <polyline
            points={points}
            fill="none"
            stroke={c.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={lastX} cy={lastY} r="3" fill={c.stroke} className="animate-glow-pulse" />
        </svg>
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] text-ink-4">
          {dayLabels?.[0] ?? "Mon"}
        </span>
        <span className="text-[10px] text-ink-4">
          {dayLabels?.[dayLabels.length - 1] ?? "Sun"}
        </span>
      </div>
    </div>
  );
}
