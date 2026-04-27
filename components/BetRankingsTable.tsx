"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, TrendingUp } from "lucide-react";
import type { OddsEvent, Sport } from "@/data/sampleOdds";

// ── types ─────────────────────────────────────────────────────────────────────

interface BetRow {
  eventId:       string;
  sport:         Sport;
  league:        string;
  leagueId?:     number;
  leagueLogo?:   string;
  homeTeam:      string;
  awayTeam:      string;
  commenceTime:  string;
  marketName:    string;
  pick:          string;
  probability:   number;
  bestOdds:      number;
  bestBookmaker: string;
  edge:          number | null;
  rankScore:     number;
}

type GroupKey = string;

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h < 1)  return `${m}m`;
  if (h < 24) return `${h}h ${m}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function extractBetRows(events: OddsEvent[]): BetRow[] {
  const rows: BetRow[] = [];

  for (const ev of events) {
    for (const market of ev.markets) {
      const picked = market.options.find((o) => o.pick);
      if (!picked) continue;

      const implied   = market.bestOdds ? (1 / market.bestOdds) * 100 : null;
      const edge      = implied !== null ? Math.round((picked.probability - implied) * 10) / 10 : null;
      const rankScore = picked.probability + (edge && edge > 0 ? edge * 0.5 : 0);

      rows.push({
        eventId:       ev.id,
        sport:         ev.sport,
        league:        ev.league,
        leagueId:      ev.leagueId,
        leagueLogo:    ev.leagueLogo,
        homeTeam:      ev.homeTeam,
        awayTeam:      ev.awayTeam,
        commenceTime:  ev.commenceTime,
        marketName:    market.name,
        pick:          picked.label,
        probability:   picked.probability,
        bestOdds:      market.bestOdds,
        bestBookmaker: market.bestBookmaker,
        edge,
        rankScore,
      });
    }
  }

  return rows.sort((a, b) => b.rankScore - a.rankScore);
}

const SPORT_LABELS: Partial<Record<Sport, string>> = {
  football:          "⚽ Football",
  basketball:        "🏀 Basketball",
  nba:               "🏀 NBA",
  american_football: "🏈 NFL / NCAA",
  formula1:          "🏎️ Formula 1",
  cricket:           "🏏 Cricket",
  rugby:             "🏉 Rugby",
  tennis:            "🎾 Tennis",
  baseball:          "⚾ Baseball",
  hockey:            "🏒 Hockey",
  mma:               "🥊 MMA",
  volleyball:        "🏐 Volleyball",
  handball:          "🤾 Handball",
  horse_racing:      "🐎 Horse Racing",
  afl:               "🦘 AFL",
};

// ── sub-components ────────────────────────────────────────────────────────────

function SignalDot({ probability }: { probability: number }) {
  if (probability >= 70)
    return <span className="h-2 w-2 rounded-full bg-accent-green shadow-[0_0_6px_rgba(34,197,94,0.6)]" />;
  if (probability >= 58)
    return <span className="h-2 w-2 rounded-full bg-blue-400" />;
  if (probability >= 48)
    return <span className="h-2 w-2 rounded-full bg-amber-400" />;
  return <span className="h-2 w-2 rounded-full bg-slate-600" />;
}

function SignalBadge({ probability }: { probability: number }) {
  if (probability >= 70)
    return <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold bg-accent-green/10 text-accent-green">STRONG</span>;
  if (probability >= 58)
    return <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-500/10 text-blue-400">SIGNAL</span>;
  if (probability >= 48)
    return <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500/10 text-amber-400">WATCH</span>;
  return <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold bg-slate-700/60 text-slate-500">LOW</span>;
}

function MiniBar({ probability }: { probability: number }) {
  const color =
    probability >= 70 ? "bg-accent-green"
    : probability >= 58 ? "bg-blue-400"
    : probability >= 48 ? "bg-amber-400"
    : "bg-slate-600";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 overflow-hidden rounded-full bg-bg-border">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${probability}%` }} />
      </div>
      <span className="tabular-nums text-xs font-bold text-white">{probability}%</span>
    </div>
  );
}

function BetRowEl({ row, onClick }: { row: BetRow; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer border-t border-bg-border transition-colors hover:bg-bg-surface"
    >
      <td className="py-3 pl-4 pr-2 sm:pl-5">
        <div className="flex items-center gap-2">
          <SignalDot probability={row.probability} />
          <span className="hidden sm:block"><SignalBadge probability={row.probability} /></span>
        </div>
      </td>

      <td className="max-w-[160px] px-2 py-3 sm:max-w-none">
        <div className="truncate text-xs font-semibold text-white">
          {row.homeTeam} <span className="text-slate-600">vs</span> {row.awayTeam}
        </div>
        <div className="mt-0.5 text-[10px] text-slate-500">{row.marketName}</div>
      </td>

      <td className="hidden px-2 py-3 md:table-cell">
        <span className="rounded-md bg-bg-border px-2 py-1 text-xs font-semibold text-slate-200">
          {row.pick}
        </span>
      </td>

      <td className="px-2 py-3">
        <MiniBar probability={row.probability} />
      </td>

      <td className="hidden px-2 py-3 text-center sm:table-cell">
        <div className="text-sm font-bold text-white">{row.bestOdds.toFixed(2)}</div>
        <div className="text-[9px] text-slate-600">{row.bestBookmaker}</div>
      </td>

      <td className="px-2 py-3 text-center">
        {row.edge !== null && row.edge > 0 ? (
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-400">
            +{row.edge}%
          </span>
        ) : (
          <span className="text-xs text-slate-700">—</span>
        )}
      </td>

      <td className="hidden py-3 pl-2 pr-4 text-right sm:table-cell sm:pr-5">
        <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          {formatTime(row.commenceTime)}
        </div>
      </td>
    </tr>
  );
}

function GroupHeader({
  groupBy, groupKey, rows, leagueId, leagueLogo, hideHeader,
}: {
  groupBy: "sport" | "league";
  groupKey: GroupKey;
  rows: BetRow[];
  leagueId?: number;
  leagueLogo?: string;
  hideHeader: boolean;
}) {
  if (hideHeader) return null;

  const label = groupBy === "sport"
    ? (SPORT_LABELS[groupKey as Sport] ?? groupKey)
    : groupKey;

  const content = (
    <div className="flex items-center justify-between border-b border-bg-border px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2.5">
        {groupBy === "league" && leagueLogo && (
          <div className="relative h-5 w-5 shrink-0">
            <Image src={leagueLogo} alt="" fill className="object-contain" sizes="20px" />
          </div>
        )}
        <span className="text-sm font-bold text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-accent-green" />
        <span className="text-xs text-slate-500">{rows.length} ranked {rows.length === 1 ? "pick" : "picks"}</span>
        {groupBy === "league" && leagueId && (
          <Link
            href={`/leagues/${leagueId}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-1 text-[11px] font-semibold text-accent-green hover:underline"
          >
            View league →
          </Link>
        )}
      </div>
    </div>
  );

  return content;
}

function PicksTable({ rows, router }: { rows: BetRow[]; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-bg-border">
            <th className="py-2.5 pl-4 pr-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:pl-5">Signal</th>
            <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">Match</th>
            <th className="hidden px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 md:table-cell">Pick</th>
            <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">Confidence</th>
            <th className="hidden px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:table-cell">Odds</th>
            <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">Edge</th>
            <th className="hidden py-2.5 pl-2 pr-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:table-cell sm:pr-5">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <BetRowEl
              key={`${row.eventId}-${i}`}
              row={row}
              onClick={() => router.push(`/predictions/${row.eventId}`)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function BetRankingsTable({
  events,
  singleSport = false,
  groupBy = "sport",
}: {
  events: OddsEvent[];
  singleSport?: boolean;
  groupBy?: "sport" | "league";
}) {
  const router = useRouter();
  const allRows = extractBetRows(events);

  if (!allRows.length) return null;

  const grouped = new Map<GroupKey, BetRow[]>();
  for (const row of allRows) {
    const key = groupBy === "league" ? row.league : row.sport;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  const groups = [...grouped.entries()];
  const hideHeader = singleSport && groups.length === 1 && groupBy === "sport";

  return (
    <div className="space-y-6">
      {groups.map(([key, rows]) => {
        const sample = rows[0];
        return (
          <div key={key} className="overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
            <GroupHeader
              groupBy={groupBy}
              groupKey={key}
              rows={rows}
              leagueId={groupBy === "league" ? sample.leagueId : undefined}
              leagueLogo={groupBy === "league" ? sample.leagueLogo : undefined}
              hideHeader={hideHeader}
            />
            <PicksTable rows={rows} router={router} />
          </div>
        );
      })}
    </div>
  );
}
