import Image from "next/image";

/**
 * Displays a player headshot. Falls back to a coloured initial circle.
 */
export default function PlayerPhoto({
  photo,
  name,
  size = 32,
  className = "",
}: {
  photo?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  if (photo) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={photo}
          alt={name}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  const colours = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-red-100 text-red-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-sky-100 text-sky-700",
    "bg-orange-100 text-orange-700",
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
