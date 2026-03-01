"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";
import { getEntityHref } from "@/data/sampleTeams";
import { getLeagueHref } from "@/data/sampleLeagues";

const SPORT_STYLES: Record<
  string,
  { label: string; color: string; bg: string; glow: string }
> = {
  football: {
    label: "Football",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    glow: "from-emerald-50",
  },
  basketball: {
    label: "Basketball",
    color: "text-orange-700",
    bg: "bg-orange-50",
    glow: "from-orange-50",
  },
  tennis: {
    label: "Tennis",
    color: "text-amber-700",
    bg: "bg-amber-50",
    glow: "from-amber-50",
  },
  american_football: {
    label: "NFL",
    color: "text-blue-700",
    bg: "bg-blue-50",
    glow: "from-blue-50",
  },
  cricket: {
    label: "Cricket",
    color: "text-pink-700",
    bg: "bg-pink-50",
    glow: "from-pink-50",
  },
};

function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  if (diffH < 1) return `in ${diffM}m`;
  if (diffH < 24) return `in ${diffH}h ${diffM}m`;
  const days = Math.floor(diffH / 24);
  return `in ${days}d ${diffH % 24}h`;
}

function FormDot({ result }: { result: "W" | "D" | "L" }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        result === "W"
          ? "bg-emerald-500"
          : result === "D"
          ? "bg-gray-300"
          : "bg-red-400"
      }`}
    />
  );
}

interface FeaturedCarouselProps {
  events: OddsEvent[];
}

function TeamNameLink({ name, align = "left" }: { name: string; align?: "left" | "right" }) {
  const href = getEntityHref(name);
  const cls = `text-xl font-extrabold leading-tight text-gray-900 transition-colors hover:text-accent-green sm:text-2xl ${
    align === "right" ? "text-right" : ""
  }`;
  if (href) {
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()} className={cls}>
        {name}
      </Link>
    );
  }
  return <span className={`text-xl font-extrabold leading-tight text-gray-900 sm:text-2xl ${align === "right" ? "text-right block" : "block"}`}>{name}</span>;
}

export default function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(index);
      setAnimKey((k) => k + 1);
    },
    []
  );

  const prev = useCallback(() => {
    goTo(current === 0 ? events.length - 1 : current - 1);
  }, [current, events.length, goTo]);

  const next = useCallback(() => {
    goTo(current === events.length - 1 ? 0 : current + 1);
  }, [current, events.length, goTo]);

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, events.length]);

  useEffect(() => {
    setCurrent(0);
    setAnimKey((k) => k + 1);
  }, [events]);

  if (events.length === 0) return null;

  const safeCurrent = Math.min(current, events.length - 1);
  const event = events[safeCurrent];
  const style = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;

  const topPick = event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0];

  const bestBookmaker = event.bookmakers.reduce((best, bm) =>
    bm.home > best.home ? bm : best
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
      {/* Subtle sport tint */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} to-transparent opacity-40`}
      />

      {/* Slide content */}
      <div
        onClick={() => router.push(`/predictions/${event.id}`)}
        className="cursor-pointer"
      >
        <div key={animKey} className="carousel-slide relative p-6 sm:p-8">
          {/* Sport badge + league + time */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}
              >
                {style.label}
              </span>
              {(() => {
                const leagueHref = getLeagueHref(event.league);
                return leagueHref ? (
                  <Link
                    href={leagueHref}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {event.league}
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">{event.league}</span>
                );
              })()}
              <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-green">
                Featured
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatKickoff(event.commenceTime)}</span>
            </div>
          </div>

          {/* Teams + form */}
          <div className="mt-6 flex items-center gap-4">
            {/* Home */}
            <div className="flex flex-1 flex-col gap-2.5">
              <TeamNameLink name={event.homeTeam} align="left" />
              <div className="flex gap-1">
                {event.homeStats.form.map((r, i) => (
                  <FormDot key={i} result={r} />
                ))}
              </div>
            </div>

            {/* VS */}
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="rounded-xl bg-bg-border px-3 py-1.5 text-sm font-bold text-gray-500">
                VS
              </span>
              <span className="text-[10px] text-gray-300">last 5</span>
            </div>

            {/* Away */}
            <div className="flex flex-1 flex-col items-end gap-2.5">
              <TeamNameLink name={event.awayTeam} align="right" />
              <div className="flex justify-end gap-1">
                {event.awayStats.form.map((r, i) => (
                  <FormDot key={i} result={r} />
                ))}
              </div>
            </div>
          </div>

          {/* Top pick row */}
          {topPick && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-bg-border pt-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 shrink-0 text-accent-green" />
                <span className="text-gray-400">Top pick:</span>
                <span className="font-semibold text-gray-800">{topPick.label}</span>
                <span className="font-bold text-accent-green">
                  {topPick.probability}%
                </span>
              </div>
              <span className="hidden text-xs text-gray-400 sm:block">
                Best odds: {bestBookmaker.home.toFixed(2)} @ {bestBookmaker.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      {events.length > 1 && (
        <div className="flex items-center justify-between border-t border-bg-border px-6 py-3 sm:px-8">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "h-2 w-4 bg-accent-green"
                    : "h-2 w-2 bg-bg-border hover:bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Prev / Next arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-bg-border text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-bg-border text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
