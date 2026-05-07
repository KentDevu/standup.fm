"use client";

export function Avatar({
  name,
  size = "md",
  color,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const gradients = [
    "from-accent-a to-accent-c",
    "from-accent-b to-accent-c",
    "from-[#FF6B6B] to-accent-b",
    "from-[#FFD166] to-accent-a",
    "from-accent-c to-[#A3E635]",
    "from-[#FF6B6B] to-[#FFD166]",
  ];
  const colorIndex =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    gradients.length;

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-base",
  };

  const bgStyle = color
    ? { background: `linear-gradient(135deg, ${color}, var(--color-accent-b))` }
    : undefined;

  return (
    <div
      className={`${sizeClasses[size]} ${!color ? `bg-gradient-to-br ${gradients[colorIndex]}` : ""} rounded-full flex items-center justify-center font-bold text-[#0a0a14] shrink-0 ring-2 ring-white/[0.08]`}
      style={bgStyle}
    >
      {initials}
    </div>
  );
}
