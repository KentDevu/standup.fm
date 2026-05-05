"use client";

export function Sparkline({
  data,
  color = "coral",
  height = 40,
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
      const y = height - ((d - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const colorMap: Record<string, string> = {
    coral: "#FF6B6B",
    mint: "#4ECDC4",
    amber: "#FBBF24",
    blue: "#60A5FA",
  };
  const strokeColor = colorMap[color] || colorMap.coral;

  return (
    <div className="bg-midnight-light rounded-xl p-4 border border-white/5">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-cream-dim uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold text-cream">{value}</span>
          <span className="text-xs text-cream-dim">{unit}</span>
        </div>
      </div>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-cream-dim">
          {dayLabels?.[0] ?? "Mon"}
        </span>
        <span className="text-[10px] text-cream-dim">
          {dayLabels?.[dayLabels.length - 1] ?? "Sun"}
        </span>
      </div>
    </div>
  );
}
