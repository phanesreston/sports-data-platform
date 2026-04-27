"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeamLogo from "@/components/TeamLogo";

interface PlayerStats {
  team:   { id: number; name: string; logo: string };
  league: { id: number; name: string; logo: string; country: string; season: number };
  games:  { appearences: number | null; minutes: number | null; position: string; rating: string | null };
  goals:  { total: number | null; assists: number | null; saves: number | null };
  shots:  { total: number | null; on: number | null };
  passes: { total: number | null; key: number | null; accuracy: string | null };
  tackles:{ total: number | null; interceptions: number | null };
  cards:  { yellow: number; red: number };
}

interface PlayerData {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    height: string | null;
    weight: string | null;
    photo: string;
    injured: boolean;
  };
  statistics: PlayerStats[];
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-border ${className}`} />;
}

function StatBox({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-xl border border-bg-border bg-bg-card px-4 py-4 text-center shadow-sm">
      <div className="text-xl font-extrabold text-white">{value ?? "—"}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

export default function AthletePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData]           = useState<PlayerData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    fetch(`/api/football/player?id=${params.id}`)
      .then(async (r) => {
        if (r.status === 429) { setRateLimited(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((json) => {
        if (!json) { if (!rateLimited) setNotFound(true); return; }
        if (json.error) { setNotFound(true); return; }
        setData(json.player);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Primary stat block = first competition with league data
  const primaryStats = data?.statistics?.[0] ?? null;
  const teamId = primaryStats?.team?.id;
  const teamName = primaryStats?.team?.name ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
            {teamName || "Back"}
          </button>

          {loading && (
            <div className="space-y-5">
              <div className="flex gap-6">
                <Skeleton className="h-32 w-32 rounded-2xl" />
                <div className="flex-1 space-y-3 pt-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            </div>
          )}

          {!loading && rateLimited && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <User className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">Too many requests</p>
              <p className="mt-1 text-sm text-slate-500">The data API is busy — please wait a moment and refresh.</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-accent-green hover:underline">
                Refresh
              </button>
            </div>
          )}

          {!loading && notFound && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-bg-border bg-bg-card py-20 text-center shadow-sm">
              <User className="mb-3 h-12 w-12 text-slate-700" />
              <p className="font-semibold text-slate-200">Player not found</p>
              <p className="mt-1 text-sm text-slate-500">This player could not be found in the database.</p>
              <Link href="/" className="mt-4 text-sm font-semibold text-accent-green hover:underline">← Back to predictions</Link>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Hero */}
              <div className="mb-8 overflow-hidden rounded-2xl border border-bg-border bg-bg-card shadow-sm">
                <div className="h-1.5 w-full bg-emerald-200" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start gap-6">
                    {/* Headshot */}
                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-bg-border shadow-sm">
                      <Image
                        src={data.player.photo}
                        alt={data.player.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {primaryStats && (
                          <Link href={`/teams/${encodeURIComponent(teamName)}`} className="flex items-center gap-1.5 rounded-md border border-bg-border px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white">
                            <TeamLogo logo={primaryStats.team.logo} name={teamName} size={16} className="rounded" />
                            {teamName}
                          </Link>
                        )}
                        {primaryStats?.league && (
                          <Link href={`/leagues/${primaryStats.league.id}`} className="flex items-center gap-1.5 rounded-md border border-bg-border px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white">
                            <div className="relative h-4 w-4">
                              <Image src={primaryStats.league.logo} alt="" fill className="object-contain" sizes="16px" />
                            </div>
                            {primaryStats.league.name}
                          </Link>
                        )}
                        {data.player.injured && (
                          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">Injured</span>
                        )}
                      </div>

                      <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{data.player.name}</h1>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {primaryStats?.games.position && (
                          <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                            {primaryStats.games.position}
                          </span>
                        )}
                        <span>{data.player.nationality}</span>
                        <span>·</span>
                        <span>Age {data.player.age}</span>
                        {data.player.height && <><span>·</span><span>{data.player.height}</span></>}
                        {data.player.weight && <><span>·</span><span>{data.player.weight}</span></>}
                      </div>

                      {primaryStats?.games.rating && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-accent-green/30 bg-accent-green/5 px-4 py-2">
                          <span className="text-2xl font-extrabold text-accent-green">{parseFloat(primaryStats.games.rating).toFixed(1)}</span>
                          <span className="text-xs text-slate-500">Avg Rating</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats per competition */}
              {data.statistics.map((stats, i) => (
                <div key={i} className="mb-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative h-5 w-5">
                      <Image src={stats.league.logo} alt="" fill className="object-contain" sizes="20px" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {stats.league.name} {stats.league.season}/{String(stats.league.season + 1).slice(2)}
                    </span>
                    <div className="flex-1 border-t border-bg-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    <StatBox label="Appearances"   value={stats.games.appearences} />
                    <StatBox label="Minutes"       value={stats.games.minutes != null ? `${stats.games.minutes}'` : null} />
                    {stats.goals.saves != null ? (
                      <>
                        <StatBox label="Saves"       value={stats.goals.saves} />
                        <StatBox label="Goals Conc." value={stats.goals.total} />
                      </>
                    ) : (
                      <>
                        <StatBox label="Goals"       value={stats.goals.total} />
                        <StatBox label="Assists"     value={stats.goals.assists} />
                      </>
                    )}
                    <StatBox label="Shots on Target" value={stats.shots.on} />
                    <StatBox label="Key Passes"    value={stats.passes.key} />
                    <StatBox label="Pass Acc."     value={stats.passes.accuracy != null ? `${stats.passes.accuracy}%` : null} />
                    <StatBox label="Tackles"       value={stats.tackles.total} />
                    <StatBox label="Interceptions" value={stats.tackles.interceptions} />
                    <StatBox label="Yellow Cards"  value={stats.cards.yellow} />
                    <StatBox label="Red Cards"     value={stats.cards.red} />
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
