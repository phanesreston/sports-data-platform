"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";  // used for league logo
import Link from "next/link";
import { useRouter } from "next/navigation";
import TeamLogo from "@/components/TeamLogo";
import { Clock, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import type { OddsEvent } from "@/data/sampleOdds";

const SPORT_STYLES: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  football:          { label: "Football",   color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "from-emerald-500/5" },
  basketball:        { label: "Basketball", color: "text-orange-400",  bg: "bg-orange-500/10",  glow: "from-orange-500/5"  },
  tennis:            { label: "Tennis",     color: "text-amber-400",   bg: "bg-amber-500/10",   glow: "from-amber-50"   },
  american_football: { label: "NFL",        color: "text-blue-400",    bg: "bg-blue-500/10",    glow: "from-blue-500/5"    },
  cricket:           { label: "Cricket",    color: "text-pink-400",    bg: "bg-pink-500/10",    glow: "from-pink-50"    },
};

function formatKickoff(isoString: string): string {
  const date = new Date(isoString);
  const now  = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH  = Math.floor(diffMs / 3600000);
  const diffM  = Math.floor((diffMs % 3600000) / 60000);
  if (diffH < 1)  return `in ${diffM}m`;
  if (diffH < 24) return `in ${diffH}h ${diffM}m`;
  return `in ${Math.floor(diffH / 24)}d ${diffH % 24}h`;
}

function FormDot({ result }: { result: "W" | "D" | "L" }) {
  return (
    <span className={`h-2.5 w-2.5 rounded-full ${
      result === "W" ? "bg-emerald-500" : result === "D" ? "bg-slate-600" : "bg-red-400"
    }`} />
  );
}

function TeamDisplay({
  name, logo, teamId, sport, align,
}: {
  name: string; logo?: string; teamId?: number; sport: string; align: "left" | "right";
}) {
  const href = `/teams/${encodeURIComponent(name)}`;
  const inner = (
    <div className={`flex items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <TeamLogo logo={logo} name={name} size={40} className="rounded-xl" />
      <span className={`text-xl font-extrabold leading-tight text-white transition-colors group-hover:text-accent-green sm:text-2xl ${
        align === "right" ? "text-right" : ""
      }`}>
        {name}
      </span>
    </div>
  );

  if (sport === "football") {
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()} className="group">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

interface FeaturedCarouselProps {
  events: OddsEvent[];
}

export default function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setAnimKey((k) => k + 1);
  }, []);

  const prev = useCallback(() => goTo(current === 0 ? events.length - 1 : current - 1), [current, events.length, goTo]);
  const next = useCallback(() => goTo(current === events.length - 1 ? 0 : current + 1), [current, events.length, goTo]);

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, events.length]);

  useEffect(() => { setCurrent(0); setAnimKey((k) => k + 1); }, [events]);

  if (events.length === 0) return null;

  const safeCurrent = Math.min(current, events.length - 1);
  const event  = events[safeCurrent];
  const style  = SPORT_STYLES[event.sport] ?? SPORT_STYLES.football;

  const topPick = event.markets
    .flatMap((m) => m.options.filter((o) => o.pick))
    .sort((a, b) => b.probability - a.probability)[0];

  const bestBookmaker = event.bookmakers.length
    ? event.bookmakers.reduce((best, bm) => (bm.home > best.home ? bm : best))
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
      {/* Sport tint */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} to-transparent opacity-40`} />

      <div onClick={() => router.push(`/predictions/${event.id}`)} className="cursor-pointer">
        <div key={animKey} className="carousel-slide relative p-6 sm:p-8">
          {/* League + time */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                {style.label}
              </span>
              {event.leagueId ? (
                <Link
                  href={`/leagues/${event.leagueId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-400"
                >
                  {event.leagueLogo && (
                    <div className="relative h-4 w-4">
                      <Image src={event.leagueLogo} alt="" fill className="object-contain" sizes="16px" />
                    </div>
                  )}
                  {event.league}
                </Link>
              ) : (
                <span className="text-xs text-slate-500">{event.league}</span>
              )}
              <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-green">
                Featured
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatKickoff(event.commenceTime)}</span>
            </div>
          </div>

          {/* Teams + form */}
          <div className="mt-6 flex items-center gap-4">
            {/* Home */}
            <div className="flex flex-1 flex-col gap-2.5">
              <TeamDisplay name={event.homeTeam} logo={event.homeLogo} teamId={event.homeTeamId} sport={event.sport} align="left" />
              <div className="flex gap-1">
                {event.homeStats.form.map((r, i) => <FormDot key={i} result={r} />)}
              </div>
            </div>

            {/* VS */}
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="rounded-xl bg-bg-border px-3 py-1.5 text-sm font-bold text-slate-400">VS</span>
              <span className="text-[10px] text-slate-600">last 5</span>
            </div>

            {/* Away */}
            <div className="flex flex-1 flex-col items-end gap-2.5">
              <TeamDisplay name={event.awayTeam} logo={event.awayLogo} teamId={event.awayTeamId} sport={event.sport} align="right" />
              <div className="flex justify-end gap-1">
                {event.awayStats.form.map((r, i) => <FormDot key={i} result={r} />)}
              </div>
            </div>
          </div>

          {/* Top pick row */}
          {topPick && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-bg-border pt-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 shrink-0 text-accent-green" />
                <span className="text-slate-500">Top pick:</span>
                <span className="font-semibold text-white">{topPick.label}</span>
                <span className="font-bold text-accent-green">{topPick.probability}%</span>
              </div>
              {bestBookmaker && (
                <span className="hidden text-xs text-slate-500 sm:block">
                  Best odds: {bestBookmaker.home.toFixed(2)} @ {bestBookmaker.name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {events.length > 1 && (
        <div className="flex items-center justify-between border-t border-bg-border px-6 py-3 sm:px-8">
          <div className="flex items-center gap-1.5">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "h-2 w-4 bg-accent-green" : "h-2 w-2 bg-bg-border hover:bg-slate-600"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} aria-label="Previous" className="flex h-7 w-7 items-center justify-center rounded-full border border-bg-border text-slate-500 transition-colors hover:border-bg-border hover:text-slate-200">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} aria-label="Next" className="flex h-7 w-7 items-center justify-center rounded-full border border-bg-border text-slate-500 transition-colors hover:border-bg-border hover:text-slate-200">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
