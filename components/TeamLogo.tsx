import Image from "next/image";

/**
 * Displays a team or club logo. Falls back to a coloured initial circle
 * when no logo URL is available, so there's always a consistent visual.
 */
export default function TeamLogo({
  logo,
  name,
  size = 24,
  className = "",
}: {
  logo?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  if (logo) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={logo}
          alt={name}
          fill
          className="object-contain p-[2px]"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  // Deterministic colour from team name — gives each team a consistent hue
  const colours = [
    "bg-emerald-500/10 text-emerald-400",
    "bg-blue-100 text-blue-400",
    "bg-red-500/10 text-red-400",
    "bg-amber-100 text-amber-400",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-400",
    "bg-sky-100 text-sky-400",
    "bg-orange-100 text-orange-400",
  ];
  const colour = colours[(name.charCodeAt(0) ?? 0) % colours.length];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${colour} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(size * 0.4, 9) }}
      title={name}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
