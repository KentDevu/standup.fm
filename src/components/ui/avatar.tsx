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

  const colors = [
    "bg-coral",
    "bg-mint",
    "bg-purple-500",
    "bg-amber-500",
    "bg-blue-500",
  ];
  const colorIndex =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    colors.length;

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
    >
      {initials}
    </div>
  );
}
