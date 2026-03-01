"use client";

import type { Sport } from "@/data/sampleOdds";

interface SportOption {
  value: Sport | "all";
  label: string;
  emoji: string;
}

const SPORT_OPTIONS: SportOption[] = [
  { value: "all", label: "All Sports", emoji: "🏆" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "basketball", label: "Basketball", emoji: "🏀" },
  { value: "tennis", label: "Tennis", emoji: "🎾" },
  { value: "american_football", label: "NFL", emoji: "🏈" },
  { value: "cricket", label: "Cricket", emoji: "🏏" },
];

interface SportFilterProps {
  selected: Sport | "all";
  onChange: (sport: Sport | "all") => void;
  counts: Partial<Record<Sport | "all", number>>;
}

export default function SportFilter({
  selected,
  onChange,
  counts,
}: SportFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPORT_OPTIONS.map((opt) => {
        const count = counts[opt.value] ?? 0;
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all
              ${
                isActive
                  ? "border-accent-green bg-accent-green/10 text-accent-green shadow-sm"
                  : "border-bg-border bg-bg-card text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }
            `}
          >
            <span>{opt.emoji}</span>
            <span>{opt.label}</span>
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  isActive
                    ? "bg-accent-green text-white"
                    : "bg-bg-border text-gray-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
