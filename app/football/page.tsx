"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  flag: string;
  logo: string;
  season: number;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />;
}

export default function FootballPage() {
  const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/football/leagues")
      .then((r) => r.json())
      .then((d) => setLeagues(d.leagues ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Football</h1>
            <p className="mt-1 text-sm text-gray-400">Select a league to view fixtures, standings, teams and top players</p>
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="group flex items-center gap-5 rounded-2xl border border-bg-border bg-bg-card p-5 shadow-sm transition-all hover:border-accent-green/40 hover:shadow-md"
                >
                  <div className="relative h-16 w-16 shrink-0">
                    {league.logo ? (
                      <Image
                        src={league.logo}
                        alt={league.name}
                        fill
                        className="object-contain"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-3xl">
                        {league.flag}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-gray-900 group-hover:text-accent-green">
                      {league.name}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-400">
                      {league.flag} {league.country} · {league.season}/{String(league.season + 1).slice(2)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-accent-green" />
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
