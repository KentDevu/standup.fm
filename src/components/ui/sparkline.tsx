"use client";

export function Sparkline({
  data,
  color = "orange",
  height = 52,
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

  const points = data
    .map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
      const y = height - ((d - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} 100,${height}`;

  const colorMap: Record<string, { stroke: string; fill: string; dot: string }> = {
    orange: { stroke: "#FB923C", fill: "url(#grad-orange)", dot: "#FDBA74" },
    gold: { stroke: "#FBBF24", fill: "url(#grad-gold)", dot: "#FDE68A" },
    rose: { stroke: "#F43F5E", fill: "url(#grad-rose)", dot: "#FB7185" },
    amber: { stroke: "#F59E0B", fill: "url(#grad-amber)", dot: "#FCD34D" },
  };
  const c = colorMap[color] || colorMap.orange;

  const lastX = data.length > 1 ? 100 : 50;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 6) - 3;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-[11px] text-cream-dim font-semibold uppercase tracking-widest">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-cream tabular-nums">{value}</span>
          <span className="text-[11px] text-cream-dim">{unit}</span>
        </div>
      </div>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad-orange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FB923C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-rose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={c.fill} />
        <polyline
          points={points}
          fill="none"
          stroke={c.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastX} cy={lastY} r="3.5" fill={c.dot} className="animate-glow-pulse" />
      </svg>
      <div className="flex justify-between mt-2.5">
        <span className="text-[10px] text-cream-muted">
          {dayLabels?.[0] ?? "Mon"}
        </span>
        <span className="text-[10px] text-cream-muted">
          {dayLabels?.[dayLabels.length - 1] ?? "Sun"}
        </span>
      </div>
    </div>
  );
}
