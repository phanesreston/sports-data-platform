"use client";

import { Newspaper } from "lucide-react";
import { getNewsForTags, type NewsCategory } from "@/data/sampleNews";

const CATEGORY_STYLES: Record<NewsCategory, { label: string; color: string; bg: string }> = {
  transfer: { label: "Transfer", color: "text-purple-400",  bg: "bg-purple-400/10" },
  injury:   { label: "Injury",   color: "text-red-400",     bg: "bg-red-400/10" },
  match:    { label: "Match",    color: "text-blue-400",    bg: "bg-blue-400/10" },
  preview:  { label: "Preview",  color: "text-indigo-400",  bg: "bg-indigo-400/10" },
  analysis: { label: "Analysis", color: "text-cyan-400",    bg: "bg-cyan-400/10" },
  general:  { label: "News",     color: "text-slate-400",   bg: "bg-slate-700/50" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NewsFeed({ tags }: { tags: string[] }) {
  const items = getNewsForTags(tags);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-bg-border bg-bg-card py-16 text-center">
        <Newspaper className="mb-3 h-10 w-10 text-slate-700" />
        <p className="text-sm font-semibold text-slate-500">No news yet</p>
        <p className="mt-1 text-xs text-slate-600">Check back soon for the latest updates</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const cat = CATEGORY_STYLES[item.category];
        return (
          <article
            key={item.id}
            className="rounded-xl border border-bg-border bg-bg-card p-4 transition-colors hover:border-slate-700"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cat.bg} ${cat.color}`}>
                {cat.label}
              </span>
              <span className="text-xs text-slate-600">{item.source}</span>
              <span className="ml-auto shrink-0 text-xs text-slate-600">{timeAgo(item.publishedAt)}</span>
            </div>
            <h3 className="text-sm font-semibold leading-snug text-white">{item.headline}</h3>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.summary}</p>
          </article>
        );
      })}
    </div>
  );
}
