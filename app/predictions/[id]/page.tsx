import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SAMPLE_ODDS } from "@/data/sampleOdds";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionCard from "@/components/PredictionCard";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return SAMPLE_ODDS.map((event) => ({ id: event.id }));
}

export default function PredictionDetailPage({ params }: Props) {
  const event = SAMPLE_ODDS.find((e) => e.id === params.id);

  if (!event) {
    notFound();
  }

  const hasDrawOdds = event.bookmakers.some((b) => b.draw != null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Predictions
          </Link>

          {/* Full prediction card (non-linkable on detail page) */}
          <PredictionCard event={event} asLink={false} />

          {/* Bookmaker odds comparison */}
          {event.bookmakers.length > 0 && (
            <div className="mt-6 rounded-2xl border border-bg-border bg-bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Odds Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bg-border text-left text-xs text-slate-500">
                      <th className="pb-3 pr-4 font-medium">Bookmaker</th>
                      <th className="pb-3 pr-4 text-right font-medium">
                        {event.homeTeam}
                      </th>
                      {hasDrawOdds && (
                        <th className="pb-3 pr-4 text-right font-medium">Draw</th>
                      )}
                      <th className="pb-3 text-right font-medium">
                        {event.awayTeam}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border">
                    {event.bookmakers.map((bk) => (
                      <tr key={bk.name}>
                        <td className="py-2.5 pr-4 text-slate-300">{bk.name}</td>
                        <td className="py-2.5 pr-4 text-right font-semibold text-white">
                          {bk.home.toFixed(2)}
                        </td>
                        {hasDrawOdds && (
                          <td className="py-2.5 pr-4 text-right text-slate-400">
                            {bk.draw != null ? bk.draw.toFixed(2) : "—"}
                          </td>
                        )}
                        <td className="py-2.5 text-right font-semibold text-white">
                          {bk.away.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
