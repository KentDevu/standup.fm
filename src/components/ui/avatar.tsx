"use client";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const gradients = [
    "from-orange to-[#FDBA74]",
    "from-gold to-[#FDE68A]",
    "from-rose to-[#FB7185]",
    "from-amber-600 to-[#F59E0B]",
    "from-orange-600 to-[#EA580C]",
    "from-pink-500 to-[#EC4899]",
  ];
  const colorIndex =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    gradients.length;

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${gradients[colorIndex]} rounded-full flex items-center justify-center font-bold text-ember shrink-0 ring-2 ring-white/[0.08]`}
    >
      {initials}
    </div>
  );
}
