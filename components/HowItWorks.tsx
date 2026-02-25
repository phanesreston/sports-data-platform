import { Database, BarChart2, Target } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "We gather the data",
    description:
      "Form guides, head-to-head records, and match statistics collected from across all major leagues and competitions worldwide.",
  },
  {
    number: "02",
    icon: BarChart2,
    title: "We run the analysis",
    description:
      "Our model weighs recent form, team strength, and historical trends to calculate the probability of each possible outcome.",
  },
  {
    number: "03",
    icon: Target,
    title: "You make the call",
    description:
      "Every prediction highlights the statistically strongest outcome so you can compare the numbers and decide with confidence.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      {/* Section header */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-purple/20 bg-accent-purple/5 px-4 py-1.5 text-sm font-medium text-accent-purple">
          Simple &amp; transparent
        </div>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-3 text-slate-400">
          Data-driven analysis, clearly explained in three steps.
        </p>
      </div>

      {/* Steps */}
      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map(({ number, icon: Icon, title, description }, index) => (
          <div
            key={number}
            className="relative flex flex-col rounded-2xl border border-bg-border bg-bg-card p-6"
          >
            {/* Connector line (between cards on desktop) */}
            {index < steps.length - 1 && (
              <div
                aria-hidden
                className="absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-bg-border sm:block"
              />
            )}

            {/* Step number */}
            <span className="mb-4 block text-4xl font-extrabold text-bg-border select-none">
              {number}
            </span>

            {/* Icon */}
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-green/10">
              <Icon className="h-5 w-5 text-accent-green" />
            </div>

            {/* Title */}
            <h3 className="mb-2 text-base font-bold text-white">{title}</h3>

            {/* Description */}
            <p className="text-sm leading-relaxed text-slate-400">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
