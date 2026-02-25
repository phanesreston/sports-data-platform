import { BarChart2, Activity, TrendingUp } from "lucide-react";

const stats = [
  { icon: BarChart2, label: "Predictions per match", value: "3+" },
  { icon: Activity, label: "Games of form tracked", value: "5" },
  { icon: TrendingUp, label: "Sports covered", value: "40+" },
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
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(96,165,250,0.10), transparent)",
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
            Stats-powered predictions
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Know the Stats.{" "}
            <span className="text-accent-green">Make Your Call.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
            We analyse team form, head-to-head records, and historical data
            across multiple outcomes — so you can make an informed decision
            before every match.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/predictions"
              className="rounded-xl bg-accent-green px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-accent-green/20 transition-all hover:bg-blue-400 hover:shadow-accent-green/30"
            >
              Browse Predictions
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
