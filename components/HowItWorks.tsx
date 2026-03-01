import { Database, BarChart2, Target } from "lucide-react";

const sections = [
  {
    number: "01",
    icon: Database,
    title: "We gather the data",
    paragraphs: [
      "Every prediction on WeLikeSportz starts with raw data. We collect form guides, head-to-head records, and match statistics from across all major leagues and competitions worldwide.",
      "This includes each team's last five results, their average goals scored and conceded, and the full historical record between the two sides — giving us a reliable picture of how teams have been performing and how they match up against each other.",
    ],
  },
  {
    number: "02",
    icon: BarChart2,
    title: "We run the analysis",
    paragraphs: [
      "Once the data is in, our model weighs each factor to calculate the probability of each possible outcome. Recent form is given more weight than older results, and head-to-head history is balanced against current team strength.",
      "The result is a probability percentage for each market — Match Result, Over/Under, and more — so you can see not just what we think is likely, but how confident we are in that assessment.",
    ],
  },
  {
    number: "03",
    icon: Target,
    title: "You make the call",
    paragraphs: [
      "Every prediction card highlights the statistically strongest outcome — the pick we'd point to based on the numbers alone. We also surface the best available odds from across the major bookmakers so you can see where the value sits.",
      "We don't tell you what to do. We present the analysis clearly and transparently so you can make an informed decision yourself.",
    ],
  },
];

export default function HowItWorks() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Article header */}
      <header className="mb-14 border-b border-bg-border pb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-purple">
          About the platform
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
          How It Works
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-500">
          WeLikeSportz turns raw match data into clear, probability-based
          predictions. Here&apos;s exactly what we do and how we do it — no
          black box, no jargon.
        </p>
      </header>

      {/* Sections */}
      <div className="space-y-16">
        {sections.map(({ number, icon: Icon, title, paragraphs }) => (
          <section key={number}>
            {/* Step marker */}
            <div className="mb-5 flex items-center gap-4">
              <span className="text-5xl font-extrabold leading-none text-gray-200 select-none">
                {number}
              </span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-green/10">
                <Icon className="h-[18px] w-[18px] text-accent-green" />
              </div>
            </div>

            {/* Heading */}
            <h2 className="mb-5 text-2xl font-bold text-gray-900">{title}</h2>

            {/* Body */}
            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-base leading-relaxed text-gray-500">
                  {p}
                </p>
              ))}
            </div>

            {/* Divider */}
            <div className="mt-12 h-px bg-bg-border" />
          </section>
        ))}
      </div>

      {/* Footer note */}
      <footer className="mt-14">
        <p className="text-sm leading-relaxed text-gray-400">
          Our analysis is statistical and based on historical data. No
          prediction is guaranteed — sport is unpredictable by nature. Always
          enjoy sport responsibly.
        </p>
      </footer>
    </article>
  );
}
