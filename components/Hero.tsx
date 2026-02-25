import { TrendingUp, Globe, BookOpen } from "lucide-react";

const stats = [
  { icon: Globe, label: "Sports covered", value: "40+" },
  { icon: BookOpen, label: "Bookmakers", value: "80+" },
  { icon: TrendingUp, label: "Markets tracked", value: "Live" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,197,94,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-green/20 bg-accent-green/5 px-4 py-1.5 text-sm font-medium text-accent-green">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
            </span>
            Live odds updated in real-time
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Bet Smarter.{" "}
            <span className="text-accent-green">Not Harder.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Compare real-time odds across 40+ sports and 80+ bookmakers in one
            place. Stop leaving value on the table.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#odds"
              className="rounded-xl bg-accent-green px-8 py-3.5 text-base font-bold text-black shadow-lg shadow-accent-green/20 transition-all hover:bg-green-400 hover:shadow-accent-green/30"
            >
              Browse Live Odds
            </a>
            <a
              href="#how-it-works"
              className="rounded-xl border border-bg-border px-8 py-3.5 text-base font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 sm:gap-8">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-bg-border bg-bg-card px-4 py-5"
            >
              <Icon className="mb-1 h-5 w-5 text-accent-green" />
              <span className="text-2xl font-extrabold text-white sm:text-3xl">
                {value}
              </span>
              <span className="text-center text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
